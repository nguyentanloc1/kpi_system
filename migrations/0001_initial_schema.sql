-- Bảng khối vận hành (regions)
CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng vị trí (positions)
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng người dùng (users)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  region_id INTEGER NOT NULL,
  position_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- Bảng template KPI theo vị trí
CREATE TABLE IF NOT EXISTS kpi_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL,
  kpi_name TEXT NOT NULL,
  weight REAL NOT NULL,
  standard_value REAL NOT NULL,
  description TEXT,
  is_for_kpi BOOLEAN DEFAULT 1, -- 1: KPI, 0: Level
  display_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- Bảng dữ liệu KPI nhập vào
CREATE TABLE IF NOT EXISTS kpi_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  kpi_template_id INTEGER NOT NULL,
  actual_value REAL NOT NULL,
  completion_percent REAL NOT NULL,
  weighted_score REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (kpi_template_id) REFERENCES kpi_templates(id),
  UNIQUE(user_id, month, year, kpi_template_id)
);

-- Bảng tổng hợp KPI và Level theo tháng
CREATE TABLE IF NOT EXISTS monthly_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_kpi_score REAL NOT NULL,
  kpi_level TEXT,
  total_level_score REAL NOT NULL,
  performance_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, month, year)
);

-- Chèn dữ liệu mẫu cho regions
INSERT INTO regions (name) VALUES 
  ('Bình Dương'),
  ('Hà Nội'),
  ('Miền Trung'),
  ('Hồ Chí Minh');

-- Chèn dữ liệu cho positions
INSERT INTO positions (name, display_name) VALUES 
  ('ptgd', 'PTGĐ'),
  ('gdkd', 'Giám đốc kinh doanh'),
  ('tlkd', 'Trợ lý kinh doanh'),
  ('gs', 'Giám sát');

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_region_position ON users(region_id, position_id);
CREATE INDEX IF NOT EXISTS idx_kpi_data_user_month ON kpi_data(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_user_month ON monthly_summary(user_id, month, year);
