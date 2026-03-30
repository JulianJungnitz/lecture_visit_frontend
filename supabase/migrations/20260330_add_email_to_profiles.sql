-- Add email to profiles for calendar invite delivery
ALTER TABLE profiles
ADD COLUMN email TEXT;

-- Create index for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Backfill existing profiles with email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.email IS NULL;

-- Create a trigger function to automatically sync email on profile creation/update
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users when profile is created or updated
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email when profile is inserted
CREATE TRIGGER sync_profile_email_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.email IS NULL)
  EXECUTE FUNCTION sync_profile_email();
