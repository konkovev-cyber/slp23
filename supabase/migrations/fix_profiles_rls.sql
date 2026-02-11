-- Unify Profiles RLS and Constraints
-- Ensure auth_id is unique and used correctly

-- 1. Ensure constraints are correct for upsert/update
DO $$ 
BEGIN 
    -- If auth_id is not already unique/PK in the live DB
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_id_key'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.profiles'::regclass AND i.indisprimary AND a.attname = 'auth_id'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_auth_id_key UNIQUE (auth_id);
    END IF;
END $$;

-- 2. Drop conflicting policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles readable by auth" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updateable by self/admin" ON public.profiles;

-- 3. Create clean, permissive-but-secure policies
-- Everyone authenticated can see profiles
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Users can update their own profile, or admins can update any profile
CREATE POLICY "profiles_update_policy" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (
    auth.uid() = auth_id 
    OR public.has_role(auth.uid(), 'admin')
);

-- Allow admins to insert profiles (needed for some flows)
CREATE POLICY "profiles_insert_policy" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = auth_id 
    OR public.has_role(auth.uid(), 'admin')
);

-- 4. Fix user_roles management for admins
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
);
