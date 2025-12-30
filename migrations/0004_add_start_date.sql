-- Thêm cột start_date vào bảng users
ALTER TABLE users ADD COLUMN start_date DATE;

-- Cập nhật ngày nhận việc cho các users (ví dụ - có thể điều chỉnh)
-- PTGĐ - thâm niên cao nhất (7 năm)
UPDATE users SET start_date = '2018-01-01' WHERE position_id = 1;

-- GĐKD - thâm niên 5 năm
UPDATE users SET start_date = '2020-01-01' WHERE position_id = 2;

-- Trợ lý KD - thâm niên 3 năm
UPDATE users SET start_date = '2022-01-01' WHERE position_id = 3;

-- Giám sát - thâm niên khác nhau
UPDATE users SET start_date = '2022-01-01' WHERE username = 'gs_binhduong';
UPDATE users SET start_date = '2023-01-01' WHERE username = 'gs_hanoi';
UPDATE users SET start_date = '2021-01-01' WHERE username = 'gs_mientrung';
UPDATE users SET start_date = '2022-06-01' WHERE username = 'gs_hcm';
