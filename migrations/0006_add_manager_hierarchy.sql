-- Add manager_id column to users table to support hierarchical structure
-- Giám sát -> Trợ lý -> Giám đốc -> Phó tổng

-- Add manager_id column (references users.id)
ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id);

-- Create index for faster queries
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Add comment explaining the hierarchy
-- Position hierarchy (top to bottom):
-- 1. PTGĐ (Phó Tổng Giám đốc) - manager_id = NULL (top level)
-- 2. GĐKD (Giám đốc Kinh doanh) - manager_id = PTGĐ id
-- 3. Trợ lý Kinh doanh - manager_id = GĐKD id
-- 4. Giám sát - manager_id = Trợ lý KD id
