-- Migration: Add employee_id column to users table
-- Date: 2024-12-26

ALTER TABLE users ADD COLUMN employee_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
