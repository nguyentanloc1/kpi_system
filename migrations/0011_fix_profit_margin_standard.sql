-- Fix "Tỷ lệ biên lợi nhuận gộp tăng so với kế hoạch" standard value from 1 to 0.2 (20%)
UPDATE kpi_templates 
SET standard_value = 0.2 
WHERE kpi_name = 'Tỷ lệ biên lợi nhuận gộp tăng so với kế hoạch';
