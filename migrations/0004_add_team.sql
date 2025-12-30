-- Migration: Add team column to users table
-- Date: 2024-12-26

ALTER TABLE users ADD COLUMN team TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
