-- Migration: Add GĐKDCC position
-- Date: 2024-12-26
-- GĐKDCC (Giám đốc kinh doanh cấp cao) has same KPI and Level as PTGĐ

INSERT INTO positions (id, name, display_name) 
VALUES (5, 'gdkdcc', 'GĐKDCC');
