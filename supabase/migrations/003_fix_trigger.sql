-- Fix: Ensure blueprintos trigger works correctly
-- This migration fixes the user creation trigger

-- Drop any conflicting triggers first
DROP TRIGGER IF EXISTS blueprintos_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with error handling
CREATE OR REPLACE FUNCTION public.blueprintos_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.blueprintos_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, blueprintos_profiles.full_name);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'blueprintos_handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER blueprintos_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_handle_new_user();

-- Confirm emails for users without confirmation
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Backfill any missing profiles from existing auth.users
INSERT INTO public.blueprintos_profiles (id, email, full_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.blueprintos_profiles)
ON CONFLICT (id) DO NOTHING;
