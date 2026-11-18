import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken, ADMIN_COOKIE_NAME, isAuthorizedAdminRole } from '@/lib/auth/jwt'

/**
 * Middleware gatekeeper for the FixMyCity Admin & Officer portal.
 * Enforces authentication and Role-Based Access Control (RBAC).
 *
 * Rules:
 * 1. Only runs on `/admin/:path*` routes.
 * 2. `/admin/login` is public. If already logged in as admin/department_head,
 *    it redirects immediately to `/admin`.
 * 3. All other `/admin/*` routes require a valid JWT cookie with role
 *    'admin' or 'department_head'. Unauthenticated or unauthorized
 *    requests are redirected to `/admin/login`.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Ignore non-admin routes (extra safeguard alongside config.matcher)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const payload = token ? await verifyAdminToken(token) : null
  const isAuthorized = Boolean(payload && isAuthorizedAdminRole(payload.role))

  // Allow access to the login page
  if (pathname === '/admin/login') {
    // If already authenticated with authorized role, redirect to admin console
    if (isAuthorized) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // Protect all other /admin routes
  if (!isAuthorized) {
    const loginUrl = new URL('/admin/login', request.url)

    // Store destination path so user can be redirected back after login
    const targetPath = pathname + search
    if (targetPath && targetPath !== '/admin') {
      loginUrl.searchParams.set('from', targetPath)
    }

    const response = NextResponse.redirect(loginUrl)

    // If a stale or invalid token exists, clean it up
    if (token && !payload) {
      response.cookies.delete(ADMIN_COOKIE_NAME)
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
