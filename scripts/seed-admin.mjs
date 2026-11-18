import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\x1b[31m[Error] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\x1b[0m')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ADMIN_EMAIL = 'admin@fixmycity.com'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_ROLE = 'admin'
const ADMIN_NAME = 'Municipal Administrator (Demo)'

async function main() {
  console.log('\n\x1b[36m=================================================================\x1b[0m')
  console.log('\x1b[36m         FixMyCity: Seeding Demo Admin Account                   \x1b[0m')
  console.log('\x1b[36m=================================================================\x1b[0m\n')

  console.log(`Hashing password for ${ADMIN_EMAIL}...`)
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds)
  console.log(`Password hash generated: ${passwordHash.slice(0, 15)}...`)

  console.log(`Checking if '${ADMIN_EMAIL}' already exists in Supabase 'profiles'...`)

  const { data: existingUser, error: checkError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle()

  if (checkError) {
    if (checkError.code === 'PGRST204' || checkError.code === '42703') {
      console.error('\n\x1b[33m⚠️  Warning: The Supabase `profiles` table is missing `email` or `password_hash` column.\x1b[0m')
      console.error('\x1b[33m👉 Please run the migration script in `scripts/auth-schema.sql` in your Supabase SQL Editor first.\x1b[0m\n')
      console.log('SQL File Path: scripts/auth-schema.sql')
      console.log('Once executed, re-run this command: node scripts/seed-admin.mjs\n')
      process.exit(1)
    }
    console.error('\x1b[31m[Error] Failed to query profiles table:\x1b[0m', checkError)
    process.exit(1)
  }

  if (existingUser) {
    console.log(`User already exists (ID: ${existingUser.id}). Updating password hash and role...`)
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        password_hash: passwordHash,
        role: ADMIN_ROLE,
        full_name: ADMIN_NAME,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('\x1b[31m[Error] Failed to update admin user:\x1b[0m', updateError)
      process.exit(1)
    }

    console.log('\n\x1b[32m✔ Demo admin user updated successfully!\x1b[0m')
    console.log(`  User ID:       ${updated.id}`)
    console.log(`  Email:         ${updated.email}`)
    console.log(`  Role:          ${updated.role}`)
    console.log(`  Full Name:     ${updated.full_name}`)
  } else {
    console.log('User does not exist. Creating new profile record...')
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          email: ADMIN_EMAIL,
          password_hash: passwordHash,
          role: ADMIN_ROLE,
          full_name: ADMIN_NAME,
          department_id: null,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('\x1b[31m[Error] Failed to insert admin user:\x1b[0m', insertError)
      process.exit(1)
    }

    console.log('\n\x1b[32m✔ Demo admin user created successfully!\x1b[0m')
    console.log(`  User ID:       ${inserted.id}`)
    console.log(`  Email:         ${inserted.email}`)
    console.log(`  Role:          ${inserted.role}`)
    console.log(`  Full Name:     ${inserted.full_name}`)
  }

  console.log('\n-----------------------------------------------------------------')
  console.log('Credentials Summary:')
  console.log(`  Email:    \x1b[1m${ADMIN_EMAIL}\x1b[0m`)
  console.log(`  Password: \x1b[1m${ADMIN_PASSWORD}\x1b[0m`)
  console.log(`  Role:     \x1b[1m${ADMIN_ROLE}\x1b[0m`)
  console.log('-----------------------------------------------------------------\n')
}

main().catch((err) => {
  console.error('[Error] Unhandled exception in seed-admin:', err)
  process.exit(1)
})
