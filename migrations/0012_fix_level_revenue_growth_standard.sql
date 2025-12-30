-- Fix "Tỷ lệ % doanh thu tăng trưởng so với kế hoạch tháng" (Level) standard value to 1 (100%)
-- This is for all positions
UPDATE kpi_templates 
SET standard_value = 1 
WHERE kpi_name = 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch tháng' 
  AND is_for_kpi = 0;
