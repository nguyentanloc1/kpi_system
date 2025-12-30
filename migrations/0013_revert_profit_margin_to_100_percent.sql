-- Revert profit margin standard value back to 100% (1.0)
-- User wants Chuẩn = 100%, not 20%

UPDATE kpi_templates 
SET standard_value = 1
WHERE kpi_name = 'Tỷ lệ biên lợi nhuận gộp tăng so với kế hoạch';
