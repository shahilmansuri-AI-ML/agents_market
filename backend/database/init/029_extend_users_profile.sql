-- Extend users table with profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Update existing users with default last_login
UPDATE users SET last_login = created_at WHERE last_login IS NULL;
