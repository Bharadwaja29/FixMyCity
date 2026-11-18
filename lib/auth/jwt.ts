import { SignJWT, jwtVerify } from 'jose'

export type UserRole = 'admin' | 'department_head' | 'citizen'

export interface AdminJWTPayload {
  userId: string
  email: string
  role: UserRole
  departmentId: number | null
  fullName?: string | null
}

export const ADMIN_COOKIE_NAME = 'fmc_admin_token'

/**
 * Returns a 256-bit or compatible secret key for HS256 JWT signing/verification.
 * Works uniformly in Edge Runtime (middleware) and Node.js server environments.
 */
function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'fixmycity-dev-admin-jwt-fallback-secret-minimum-32-chars!'

  return new TextEncoder().encode(secret)
}

/**
 * Signs a JWT token containing admin/officer claims with a 7-day expiration.
 */
export async function signAdminToken(payload: AdminJWTPayload): Promise<string> {
  const secretKey = getJwtSecretKey()

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    departmentId: payload.departmentId,
    fullName: payload.fullName ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

/**
 * Verifies and decodes a JWT token.
 * Returns the verified AdminJWTPayload or null if invalid/expired.
 */
export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  if (!token) {
    return null
  }

  try {
    const secretKey = getJwtSecretKey()
    const { payload } = await jwtVerify(token, secretKey)

    const role = payload.role as UserRole
    if (role !== 'admin' && role !== 'department_head' && role !== 'citizen') {
      return null
    }

    return {
      userId: String(payload.userId || payload.sub || ''),
      email: String(payload.email || ''),
      role,
      departmentId: typeof payload.departmentId === 'number' ? payload.departmentId : null,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : null,
    }
  } catch {
    return null
  }
}

/**
 * Helper to check whether a role has officer/admin console privileges.
 */
export function isAuthorizedAdminRole(role?: string | null): boolean {
  return role === 'admin' || role === 'department_head'
}
