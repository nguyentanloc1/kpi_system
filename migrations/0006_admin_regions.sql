-- Migration: Add admin_regions table for multi-region access
-- Date: 2024-12-26

CREATE TABLE IF NOT EXISTS admin_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  region_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
  UNIQUE(user_id, region_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_regions_user ON admin_regions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_regions_region ON admin_regions(region_id);

-- Assign regions to admins
-- admin: all regions (1, 2, 3, 4)
INSERT INTO admin_regions (user_id, region_id) 
SELECT id, 1 FROM users WHERE username = 'admin'
UNION SELECT id, 2 FROM users WHERE username = 'admin'
UNION SELECT id, 3 FROM users WHERE username = 'admin'
UNION SELECT id, 4 FROM users WHERE username = 'admin';

-- admin1: Bình Dương only (1)
INSERT INTO admin_regions (user_id, region_id) 
SELECT id, 1 FROM users WHERE username = 'admin1';

-- admin2: Hồ Chí Minh only (4)
INSERT INTO admin_regions (user_id, region_id) 
SELECT id, 4 FROM users WHERE username = 'admin2';

-- admin3: Hà Nội (2) and Miền Trung (3)
INSERT INTO admin_regions (user_id, region_id) 
SELECT id, 2 FROM users WHERE username = 'admin3'
UNION SELECT id, 3 FROM users WHERE username = 'admin3';
