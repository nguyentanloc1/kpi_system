-- Thêm tài khoản admin
INSERT INTO users (username, password, full_name, region_id, position_id, start_date) 
VALUES ('admin', 'admin123', 'Quản trị viên', 1, 1, '2020-01-01');

-- Cập nhật để phân biệt admin (có thể dùng position_id hoặc thêm cột role)
-- Tạm thời dùng username = 'admin' để phân biệt
