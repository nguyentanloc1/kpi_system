-- Create revenue plan table
CREATE TABLE IF NOT EXISTS revenue_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  planned_revenue REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, year, month)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_revenue_plan_user_year ON revenue_plan(user_id, year);
CREATE INDEX IF NOT EXISTS idx_revenue_plan_year_month ON revenue_plan(year, month);
