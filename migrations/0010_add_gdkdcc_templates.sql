-- Add KPI templates for GĐKDCC (position_id = 5), same as PTGĐ
-- KPI templates (is_for_kpi = 1)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
(5, 'Số lượng GĐKD và PTGĐ có nhân sự kế thừa đạt chuẩn', 0.15, 1, 1, 1),
(5, 'Số lượng hoạt động tổ chức/năm để kết nối khách hàng, cộng đồng nhân sự', 0.1, 2, 1, 2),
(5, 'Số lượng ký mới khách hàng hạng A', 0.1, 2, 1, 3),
(5, 'Tỷ lệ GĐKD đạt chuẩn KPI', 0.15, 0.8, 1, 4),
(5, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 1, 5),
(5, 'Tỷ lệ biên lợi nhuận gộp tăng so với kế hoạch', 0.2, 1, 1, 6);

-- Level templates (is_for_kpi = 0)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
(5, 'Tổng số doanh thu', 0.4, 40000000000, 0, 1),
(5, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch tháng', 0.3, 1, 0, 2),
(5, 'Số lượng cấp giám đốc trở lên đạt chuẩn', 0.2, 3, 0, 3),
(5, 'Số năm thâm niên', 0.1, 7, 0, 4);
