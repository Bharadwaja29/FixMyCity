import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'
import { signAdminToken, ADMIN_COOKIE_NAME, isAuthorizedAdminRole, type UserRole } from '@/lib/auth/jwt'

interface LoginRequestBody {
  email?: string
  password?: string
}

interface ProfileRow {
  id: string
  email: string
  password_hash: string | null
  role: string
  department_id: number | null
  full_name: string | null
}

// Fallback demo credentials for testing before running the SQL schema migration in Supabase
const DEMO_ADMIN_EMAIL = 'admin@fixmycity.com'
const DEMO_ADMIN_PASSWORD = 'admin123'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    let profile: ProfileRow | null = null
    let dbMissingColumns = false

    try {
      const supabase = getSupabaseServerClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, password_hash, role, department_id, full_name')
        .eq('email', email)
        .maybeSingle()

      if (error) {
        // PGRST204: column doesn't exist yet in Supabase schema cache
        // 42703: column does not exist in postgres
        if (error.code === 'PGRST204' || error.code === '42703') {
          dbMissingColumns = true
          console.warn(
            '[Admin Auth] Supabase `profiles` table is missing `email` or `password_hash` column. Please run scripts/auth-schema.sql in Supabase SQL Editor.',
          )
        } else {
          console.error('[Admin Auth] Database query error:', error)
          return NextResponse.json(
            { error: 'Database error occurred during authentication' },
            { status: 500 },
          )
        }
      } else {
        profile = data as ProfileRow | null
      }
    } catch (err) {
      console.error('[Admin Auth] Failed to connect to Supabase:', err)
      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable' },
        { status: 503 },
      )
    }

    // If database columns are not yet added via scripts/auth-schema.sql, support fallback demo credentials
    if (dbMissingColumns) {
      if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
        const token = await signAdminToken({
          userId: '00000000-0000-0000-0000-000000000001',
          email: DEMO_ADMIN_EMAIL,
          role: 'admin',
          departmentId: null,
          fullName: 'Municipal Administrator (Demo)',
        })

        const response = NextResponse.json({
          success: true,
          message: 'Logged in successfully (Demo admin mode)',
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: DEMO_ADMIN_EMAIL,
            role: 'admin' as UserRole,
            departmentId: null,
            fullName: 'Municipal Administrator (Demo)',
          },
        })

        response.cookies.set(ADMIN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return response
      }

      return NextResponse.json(
        {
          error:
            "Database schema not yet updated. Please run 'scripts/auth-schema.sql' in the Supabase SQL Editor, or use the demo credentials (admin@fixmycity.com / admin123).",
        },
        { status: 400 },
      )
    }

    // If user is not found in database
    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    // Verify password against stored bcrypt hash
    if (!profile.password_hash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    const isPasswordValid = await verifyPassword(password, profile.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    // Role-Based Access Control (RBAC): Only 'admin' or 'department_head'
    if (!isAuthorizedAdminRole(profile.role)) {
      return NextResponse.json(
        {
          error:
            'Unauthorized role. Only administrators and department heads may access the officer portal.',
        },
        { status: 403 },
      )
    }

    // Generate signed JWT token
    const token = await signAdminToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      departmentId: profile.department_id,
      fullName: profile.full_name,
    })

    // Construct JSON response
    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        departmentId: profile.department_id,
        fullName: profile.full_name,
      },
    })

    // Set secure HTTP-only cookie
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('[Admin Auth] Unexpected login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 },
    )
  }
}
