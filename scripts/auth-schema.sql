-- ==============================================================================
-- FixMyCity: Authentication & Role-Based Access Control (RBAC) Schema
-- ==============================================================================
-- Run this script in the Supabase Dashboard SQL Editor (or psql console).
-- It updates or creates the `profiles` table to support staff/officer authentication
-- with email, password_hash, role ('admin' | 'department_head' | 'citizen'),
-- and nullable department_id.
-- ==============================================================================

-- 1. Create enum type for roles if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'department_head', 'citizen');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

-- 2. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'citizen',
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. If profiles already existed, add missing columns safely
DO $$
BEGIN
    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    -- password_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
    END IF;

    -- role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'citizen';
    END IF;

    -- department_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    -- full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END$$;

-- 4. Ensure email is unique and role is constrained
DO $$
BEGIN
    -- Add unique constraint on email if not already unique
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_unique' AND conrelid = 'public.profiles'::regclass
    ) THEN
        -- Only add if not already constrained
        BEGIN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
        EXCEPTION
            WHEN others THEN null;
        END;
    END IF;

    -- Add role check constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check' AND conrelid = 'public.profiles'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
                CHECK (role IN ('admin', 'department_head', 'citizen'));
        EXCEPTION
            WHEN others THEN null;
        END;
    END IF;
END$$;

-- 5. Indexes for fast authentication lookups and RBAC checks
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);

-- 6. Enable Row Level Security (RLS) if required
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our backend uses SUPABASE_SERVICE_ROLE_KEY)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON public.profiles
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END$$;

-- Optional: If using Prisma, the corresponding schema definition is:
/*
enum UserRole {
  admin
  department_head
  citizen
}

model Profile {
  id           String      @id @default(uuid()) @db.Uuid
  email        String?     @unique
  passwordHash String?     @map("password_hash")
  role         UserRole    @default(citizen)
  departmentId Int?        @map("department_id")
  department   Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  fullName     String?     @map("full_name")
  createdAt    DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime    @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  @@map("profiles")
}
*/
