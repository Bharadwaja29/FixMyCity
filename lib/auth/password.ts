import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hash a plain text password using bcrypt.
 *
 * @param password Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a stored bcrypt hash.
 *
 * @param password Plain text password to test
 * @param hash Stored bcrypt hash string
 * @returns Boolean indicating whether the password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false
  }
  return bcrypt.compare(password, hash)
}
