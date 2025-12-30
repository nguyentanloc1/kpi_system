-- KPI Templates cho vị trí PTGĐ (KPI)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (1, 'Số lượng GĐKD và PTGĐ có nhân sự kế thừa đạt chuẩn', 0.15, 1, 1, 1),
  (1, 'Số lượng hoạt động tổ chức/năm để kết nối khách hàng, cộng đồng nhân sự', 0.1, 2, 1, 2),
  (1, 'Số lượng ký mới khách hàng hạng A', 0.1, 2, 1, 3),
  (1, 'Tỷ lệ GĐKD đạt chuẩn KPI', 0.15, 0.8, 1, 4),
  (1, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 1, 5),
  (1, 'Tỷ lệ biên lợi nhuận gộp tăng so với kế hoạch', 0.2, 1, 1, 6);

-- Level metrics cho PTGĐ
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (1, 'Tổng số doanh thu', 0.4, 40000000000, 0, 1),
  (1, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch tháng', 0.3, 1, 0, 2),
  (1, 'Số lượng cấp giám đốc trở lên đạt chuẩn', 0.2, 3, 0, 3),
  (1, 'Số năm thâm niên', 0.1, 7, 0, 4);

-- KPI Templates cho Giám đốc kinh doanh (KPI)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (2, 'Số lượng từ cấp trợ lý trở lên tới cấp GĐKD có ít nhất 01 nhân sự kế thừa đạt chuẩn', 0.1, 1, 1, 1),
  (2, 'Số buổi đào tạo/Coaching hạt giống và trợ lý KD/năm', 0.1, 2, 1, 2),
  (2, 'Tỷ lệ duy trì khách hàng cũ', 0.1, 0.95, 1, 3),
  (2, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 1, 4),
  (2, 'Tỷ lệ khách hàng OS đạt phí dịch vụ là 35k/người/ngày', 0.2, 0.8, 1, 5),
  (2, 'Tỷ lệ giữ chân tổng người lao động OS/tổng mục tiêu OS', 0.2, 0.8, 1, 6);

-- Level metrics cho GĐKD
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (2, 'Tổng số doanh thu', 0.4, 18000000000, 0, 1),
  (2, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 0, 2),
  (2, 'Số lượng cấp trợ lý trở lên đạt chuẩn', 0.2, 2, 0, 3),
  (2, 'Số năm thâm niên', 0.1, 5, 0, 4);

-- KPI Templates cho Trợ lý kinh doanh (KPI)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (3, 'Tỷ lệ nhân sự đạt chuẩn KPI theo level', 0.15, 0.8, 1, 1),
  (3, 'Tỷ lệ SOP được phân công hoàn thành việc rà soát và cập nhật', 0.1, 0.9, 1, 2),
  (3, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 1, 3),
  (3, 'Tỷ lệ % khách hàng OS đạt phí dịch vụ là 35k/người/ngày', 0.15, 0.8, 1, 4),
  (3, 'Số lượng trao đổi nhắn tin zalo với khách hàng tiềm năng/ngày', 0.1, 5, 1, 5),
  (3, 'Tỷ lệ giữ chân tổng người lao động OS/tổng mục tiêu OS', 0.2, 0.8, 1, 6);

-- Level metrics cho Trợ lý KD
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (3, 'Tổng số doanh thu', 0.4, 15000000000, 0, 1),
  (3, 'Tỷ lệ % doanh thu tăng trưởng so với kế hoạch', 0.3, 1, 0, 2),
  (3, 'Số lượng trao đổi nhắn tin zalo với khách hàng tiềm năng/ngày', 0.2, 5, 0, 3),
  (3, 'Số năm cống hiến', 0.1, 3, 0, 4);

-- KPI Templates cho Giám sát (KPI)
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (4, 'Số lượng lao động tiềm năng tư vấn mỗi ngày', 0.1, 40, 1, 1),
  (4, 'Số lượng lao động mới tuyển dụng nhận việc mỗi tháng', 0.4, 40, 1, 2),
  (4, 'Số lượng lao động quản lý mỗi tháng', 0.1, 100, 1, 3),
  (4, 'Số lượng video post lên kênh truyền thông mỗi ngày', 0.1, 1, 1, 4),
  (4, 'Tỷ lệ % hoạt động tuân thủ kết quả theo SOP đã được công bố', 0.1, 0.9, 1, 5),
  (4, 'Tỷ lệ giữ chân tổng người lao động OS/tổng mục tiêu OS', 0.2, 0.8, 1, 6);

-- Level metrics cho Giám sát
INSERT INTO kpi_templates (position_id, kpi_name, weight, standard_value, is_for_kpi, display_order) VALUES
  (4, 'Số lượng lao động tiềm năng tư vấn mỗi ngày', 0.15, 40, 0, 1),
  (4, 'Số lượng lao động mới tuyển dụng nhận việc mỗi tháng', 0.5, 40, 0, 2),
  (4, 'Số lượng lao động quản lý mỗi tháng', 0.25, 100, 0, 3),
  (4, 'Số năm kinh nghiệm', 0.1, 3, 0, 4);
