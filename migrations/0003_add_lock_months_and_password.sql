-- Table to track locked months (approved by admin)
CREATE TABLE IF NOT EXISTS lock_months (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  position_id INTEGER NOT NULL,
  locked_by INTEGER NOT NULL,
  locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(year, month, position_id),
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (locked_by) REFERENCES users(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lock_months_year_month ON lock_months(year, month, position_id);

-- Add password column to users table if not exists
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS directly
-- We'll handle this in the migration check
