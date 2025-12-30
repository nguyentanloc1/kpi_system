-- =====================================================
-- SCRIPT TẠO TOÀN BỘ TÀI KHOẢN CHO HỆ THỐNG KPI
-- Cấu trúc: 4 PTGĐ → 16 GĐKD → 64 TLKD → 320 Giám sát
-- Tổng: 404 tài khoản
-- =====================================================

-- Region IDs:
-- 1: Bình Dương
-- 2: Hà Nội
-- 3: Miền Trung
-- 4: Hồ Chí Minh

-- Position IDs:
-- 1: PTGĐ (Phó Tổng Giám Đốc)
-- 2: GĐKD (Giám Đốc Kinh Doanh)
-- 3: TLKD (Trợ Lý Kinh Doanh)
-- 4: Giám sát

-- =====================================================
-- 1. TẠO 4 PTGĐ
-- =====================================================

-- PTGĐ Bình Dương (ID: 17)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES ('ptgd_binhduong', '123456', 'Nguyễn Quốc Trung', 1, 1, '2020-01-15', NULL);

-- PTGĐ Hà Nội (ID: 18)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES ('ptgd_hanoi', '123456', 'Đỗ Đức Chí', 2, 1, '2020-02-01', NULL);

-- PTGĐ Hồ Chí Minh (ID: 19)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES ('ptgd_hochiminh', '123456', 'Vũ Quang Hoan', 4, 1, '2020-03-10', NULL);

-- PTGĐ Miền Trung (ID: 20)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES ('ptgd_mientrung', '123456', 'Lê Thị Bích Hạnh', 3, 1, '2020-04-05', NULL);

-- =====================================================
-- 2. TẠO 16 GĐKD (4 GĐKD cho mỗi PTGĐ)
-- =====================================================

-- GĐKD cho PTGĐ Bình Dương (IDs: 21-24)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gdkd_bd_01', '123456', 'Trần Văn An', 1, 2, '2020-05-01', 17),
('gdkd_bd_02', '123456', 'Lê Thị Bình', 1, 2, '2020-05-15', 17),
('gdkd_bd_03', '123456', 'Phạm Văn Cường', 1, 2, '2020-06-01', 17),
('gdkd_bd_04', '123456', 'Nguyễn Thị Dung', 1, 2, '2020-06-15', 17);

-- GĐKD cho PTGĐ Hà Nội (IDs: 25-28)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gdkd_hn_01', '123456', 'Hoàng Văn Em', 2, 2, '2020-07-01', 18),
('gdkd_hn_02', '123456', 'Đặng Thị Phương', 2, 2, '2020-07-15', 18),
('gdkd_hn_03', '123456', 'Vũ Văn Giang', 2, 2, '2020-08-01', 18),
('gdkd_hn_04', '123456', 'Trần Thị Hoa', 2, 2, '2020-08-15', 18);

-- GĐKD cho PTGĐ Hồ Chí Minh (IDs: 29-32)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gdkd_hcm_01', '123456', 'Lê Văn Ích', 4, 2, '2020-09-01', 19),
('gdkd_hcm_02', '123456', 'Nguyễn Thị Kim', 4, 2, '2020-09-15', 19),
('gdkd_hcm_03', '123456', 'Phạm Văn Long', 4, 2, '2020-10-01', 19),
('gdkd_hcm_04', '123456', 'Trần Thị Mai', 4, 2, '2020-10-15', 19);

-- GĐKD cho PTGĐ Miền Trung (IDs: 33-36)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gdkd_mt_01', '123456', 'Võ Văn Nam', 3, 2, '2020-11-01', 20),
('gdkd_mt_02', '123456', 'Đỗ Thị Oanh', 3, 2, '2020-11-15', 20),
('gdkd_mt_03', '123456', 'Lê Văn Phúc', 3, 2, '2020-12-01', 20),
('gdkd_mt_04', '123456', 'Nguyễn Thị Quỳnh', 3, 2, '2020-12-15', 20);

-- =====================================================
-- 3. TẠO 64 TLKD (4 TLKD cho mỗi GĐKD)
-- =====================================================

-- TLKD cho GĐKD Bình Dương 01 (IDs: 37-40)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_bd_01_01', '123456', 'Bùi Văn Anh', 1, 3, '2021-01-10', 21),
('tlkd_bd_01_02', '123456', 'Cao Thị Bảo', 1, 3, '2021-01-20', 21),
('tlkd_bd_01_03', '123456', 'Đinh Văn Chiến', 1, 3, '2021-02-01', 21),
('tlkd_bd_01_04', '123456', 'Đặng Thị Duyên', 1, 3, '2021-02-10', 21);

-- TLKD cho GĐKD Bình Dương 02 (IDs: 41-44)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_bd_02_01', '123456', 'Hà Văn Đức', 1, 3, '2021-02-20', 22),
('tlkd_bd_02_02', '123456', 'Huỳnh Thị Em', 1, 3, '2021-03-01', 22),
('tlkd_bd_02_03', '123456', 'Khương Văn Phong', 1, 3, '2021-03-10', 22),
('tlkd_bd_02_04', '123456', 'Lâm Thị Giang', 1, 3, '2021-03-20', 22);

-- TLKD cho GĐKD Bình Dương 03 (IDs: 45-48)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_bd_03_01', '123456', 'Lý Văn Hải', 1, 3, '2021-04-01', 23),
('tlkd_bd_03_02', '123456', 'Mai Thị Hương', 1, 3, '2021-04-10', 23),
('tlkd_bd_03_03', '123456', 'Ngô Văn Ích', 1, 3, '2021-04-20', 23),
('tlkd_bd_03_04', '123456', 'Ông Thị Khánh', 1, 3, '2021-05-01', 23);

-- TLKD cho GĐKD Bình Dương 04 (IDs: 49-52)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_bd_04_01', '123456', 'Phan Văn Long', 1, 3, '2021-05-10', 24),
('tlkd_bd_04_02', '123456', 'Quách Thị Minh', 1, 3, '2021-05-20', 24),
('tlkd_bd_04_03', '123456', 'Tạ Văn Năm', 1, 3, '2021-06-01', 24),
('tlkd_bd_04_04', '123456', 'Trịnh Thị Oanh', 1, 3, '2021-06-10', 24);

-- TLKD cho GĐKD Hà Nội 01 (IDs: 53-56)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hn_01_01', '123456', 'Ung Văn Phúc', 2, 3, '2021-06-20', 25),
('tlkd_hn_01_02', '123456', 'Vương Thị Quỳnh', 2, 3, '2021-07-01', 25),
('tlkd_hn_01_03', '123456', 'Xa Văn Rừng', 2, 3, '2021-07-10', 25),
('tlkd_hn_01_04', '123456', 'Yên Thị Sáng', 2, 3, '2021-07-20', 25);

-- TLKD cho GĐKD Hà Nội 02 (IDs: 57-60)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hn_02_01', '123456', 'An Văn Tài', 2, 3, '2021-08-01', 26),
('tlkd_hn_02_02', '123456', 'Bích Thị Uyên', 2, 3, '2021-08-10', 26),
('tlkd_hn_02_03', '123456', 'Cẩm Văn Vũ', 2, 3, '2021-08-20', 26),
('tlkd_hn_02_04', '123456', 'Dương Thị Xuân', 2, 3, '2021-09-01', 26);

-- TLKD cho GĐKD Hà Nội 03 (IDs: 61-64)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hn_03_01', '123456', 'Gia Văn Yên', 2, 3, '2021-09-10', 27),
('tlkd_hn_03_02', '123456', 'Hiền Thị Anh', 2, 3, '2021-09-20', 27),
('tlkd_hn_03_03', '123456', 'Khánh Văn Bình', 2, 3, '2021-10-01', 27),
('tlkd_hn_03_04', '123456', 'Linh Thị Chi', 2, 3, '2021-10-10', 27);

-- TLKD cho GĐKD Hà Nội 04 (IDs: 65-68)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hn_04_01', '123456', 'Minh Văn Dũng', 2, 3, '2021-10-20', 28),
('tlkd_hn_04_02', '123456', 'Nga Thị Em', 2, 3, '2021-11-01', 28),
('tlkd_hn_04_03', '123456', 'Phong Văn Hải', 2, 3, '2021-11-10', 28),
('tlkd_hn_04_04', '123456', 'Quyên Thị Hoa', 2, 3, '2021-11-20', 28);

-- TLKD cho GĐKD Hồ Chí Minh 01 (IDs: 69-72)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hcm_01_01', '123456', 'Sơn Văn Khoa', 4, 3, '2021-12-01', 29),
('tlkd_hcm_01_02', '123456', 'Tâm Thị Lan', 4, 3, '2021-12-10', 29),
('tlkd_hcm_01_03', '123456', 'Thắng Văn Minh', 4, 3, '2021-12-20', 29),
('tlkd_hcm_01_04', '123456', 'Uyên Thị Ngọc', 4, 3, '2022-01-01', 29);

-- TLKD cho GĐKD Hồ Chí Minh 02 (IDs: 73-76)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hcm_02_01', '123456', 'Vinh Văn Phong', 4, 3, '2022-01-10', 30),
('tlkd_hcm_02_02', '123456', 'Xuân Thị Quyên', 4, 3, '2022-01-20', 30),
('tlkd_hcm_02_03', '123456', 'Yến Văn Sơn', 4, 3, '2022-02-01', 30),
('tlkd_hcm_02_04', '123456', 'Ánh Thị Trang', 4, 3, '2022-02-10', 30);

-- TLKD cho GĐKD Hồ Chí Minh 03 (IDs: 77-80)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hcm_03_01', '123456', 'Bảo Văn Uyên', 4, 3, '2022-02-20', 31),
('tlkd_hcm_03_02', '123456', 'Châu Thị Vân', 4, 3, '2022-03-01', 31),
('tlkd_hcm_03_03', '123456', 'Đạt Văn Xuân', 4, 3, '2022-03-10', 31),
('tlkd_hcm_03_04', '123456', 'Hằng Thị Yến', 4, 3, '2022-03-20', 31);

-- TLKD cho GĐKD Hồ Chí Minh 04 (IDs: 81-84)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_hcm_04_01', '123456', 'Kiên Văn An', 4, 3, '2022-04-01', 32),
('tlkd_hcm_04_02', '123456', 'Liên Thị Bình', 4, 3, '2022-04-10', 32),
('tlkd_hcm_04_03', '123456', 'Nam Văn Chiến', 4, 3, '2022-04-20', 32),
('tlkd_hcm_04_04', '123456', 'Phương Thị Dung', 4, 3, '2022-05-01', 32);

-- TLKD cho GĐKD Miền Trung 01 (IDs: 85-88)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_mt_01_01', '123456', 'Quân Văn Em', 3, 3, '2022-05-10', 33),
('tlkd_mt_01_02', '123456', 'Sang Thị Hà', 3, 3, '2022-05-20', 33),
('tlkd_mt_01_03', '123456', 'Tú Văn Giang', 3, 3, '2022-06-01', 33),
('tlkd_mt_01_04', '123456', 'Vân Thị Hương', 3, 3, '2022-06-10', 33);

-- TLKD cho GĐKD Miền Trung 02 (IDs: 89-92)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_mt_02_01', '123456', 'Xuyến Văn Ích', 3, 3, '2022-06-20', 34),
('tlkd_mt_02_02', '123456', 'Yên Thị Khanh', 3, 3, '2022-07-01', 34),
('tlkd_mt_02_03', '123456', 'Bình Văn Lâm', 3, 3, '2022-07-10', 34),
('tlkd_mt_02_04', '123456', 'Chi Thị Mai', 3, 3, '2022-07-20', 34);

-- TLKD cho GĐKD Miền Trung 03 (IDs: 93-96)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_mt_03_01', '123456', 'Dũng Văn Năm', 3, 3, '2022-08-01', 35),
('tlkd_mt_03_02', '123456', 'Em Thị Oanh', 3, 3, '2022-08-10', 35),
('tlkd_mt_03_03', '123456', 'Giang Văn Phúc', 3, 3, '2022-08-20', 35),
('tlkd_mt_03_04', '123456', 'Hà Thị Quỳnh', 3, 3, '2022-09-01', 35);

-- TLKD cho GĐKD Miền Trung 04 (IDs: 97-100)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('tlkd_mt_04_01', '123456', 'Hương Văn Rừng', 3, 3, '2022-09-10', 36),
('tlkd_mt_04_02', '123456', 'Khanh Thị Sang', 3, 3, '2022-09-20', 36),
('tlkd_mt_04_03', '123456', 'Lâm Văn Thái', 3, 3, '2022-10-01', 36),
('tlkd_mt_04_04', '123456', 'Mai Thị Uyên', 3, 3, '2022-10-10', 36);

-- =====================================================
-- 4. TẠO 320 GIÁM SÁT (5 Giám sát cho mỗi TLKD)
-- =====================================================
-- Sử dụng format: gs_[region]_[gdkd]_[tlkd]_[number]
-- Ví dụ: gs_bd_01_01_01 = Giám sát Bình Dương, GĐKD 01, TLKD 01, số 01
-- =====================================================

-- Giám sát cho TLKD BD 01 01 (IDs: 101-105)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gs_bd_01_01_01', '123456', 'Test 1 Giám sát', 1, 4, '2022-10-20', 37),
('gs_bd_01_01_02', '123456', 'Test 2 Giám sát', 1, 4, '2022-11-01', 37),
('gs_bd_01_01_03', '123456', 'Test 3 Giám sát', 1, 4, '2022-11-10', 37),
('gs_bd_01_01_04', '123456', 'Test 4 Giám sát', 1, 4, '2022-11-20', 37),
('gs_bd_01_01_05', '123456', 'Test 5 Giám sát', 1, 4, '2022-12-01', 37);

-- Giám sát cho TLKD BD 01 02 (IDs: 106-110)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gs_bd_01_02_01', '123456', 'Test 6 Giám sát', 1, 4, '2022-12-10', 38),
('gs_bd_01_02_02', '123456', 'Test 7 Giám sát', 1, 4, '2022-12-20', 38),
('gs_bd_01_02_03', '123456', 'Test 8 Giám sát', 1, 4, '2023-01-01', 38),
('gs_bd_01_02_04', '123456', 'Test 9 Giám sát', 1, 4, '2023-01-10', 38),
('gs_bd_01_02_05', '123456', 'Test 10 Giám sát', 1, 4, '2023-01-20', 38);

-- Giám sát cho TLKD BD 01 03 (IDs: 111-115)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gs_bd_01_03_01', '123456', 'Test 11 Giám sát', 1, 4, '2023-02-01', 39),
('gs_bd_01_03_02', '123456', 'Test 12 Giám sát', 1, 4, '2023-02-10', 39),
('gs_bd_01_03_03', '123456', 'Test 13 Giám sát', 1, 4, '2023-02-20', 39),
('gs_bd_01_03_04', '123456', 'Test 14 Giám sát', 1, 4, '2023-03-01', 39),
('gs_bd_01_03_05', '123456', 'Test 15 Giám sát', 1, 4, '2023-03-10', 39);

-- Giám sát cho TLKD BD 01 04 (IDs: 116-120)
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id)
VALUES 
('gs_bd_01_04_01', '123456', 'Test 16 Giám sát', 1, 4, '2023-03-20', 40),
('gs_bd_01_04_02', '123456', 'Test 17 Giám sát', 1, 4, '2023-04-01', 40),
('gs_bd_01_04_03', '123456', 'Test 18 Giám sát', 1, 4, '2023-04-10', 40),
('gs_bd_01_04_04', '123456', 'Test 19 Giám sát', 1, 4, '2023-04-20', 40),
('gs_bd_01_04_05', '123456', 'Test 20 Giám sát', 1, 4, '2023-05-01', 40);

-- Continue with remaining TLKD (còn 60 TLKD nữa, mỗi TLKD có 5 Giám sát)
-- Do file quá dài (404 tài khoản), tôi sẽ tạo script Python để generate

