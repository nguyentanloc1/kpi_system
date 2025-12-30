-- Script to manually trigger Level auto-fill for existing KPI data
-- This is a workaround since the auto-fill logic was added after users already entered KPI data
-- 
-- To use this script:
-- 1. User needs to re-save their KPI data to trigger the auto-fill logic
-- OR
-- 2. We need to write a custom migration that calls the same logic
--
-- For now, the easiest solution is:
-- Ask user to go to "Nhập KPI" tab, select month, click "Tải dữ liệu", then click "Lưu dữ liệu KPI" again
-- This will trigger the backend auto-fill logic for Level data

-- Check current state
SELECT 
  u.full_name,
  u.position_id,
  kd.month,
  kd.year,
  COUNT(CASE WHEN kt.is_for_kpi = 1 THEN 1 END) as kpi_count,
  COUNT(CASE WHEN kt.is_for_kpi = 0 THEN 1 END) as level_count
FROM kpi_data kd
JOIN users u ON kd.user_id = u.id
JOIN kpi_templates kt ON kd.kpi_template_id = kt.id
WHERE u.position_id IN (1, 2, 3, 5)
GROUP BY u.id, kd.month, kd.year
HAVING kpi_count > 0 AND level_count = 0
ORDER BY u.full_name, kd.year, kd.month;
