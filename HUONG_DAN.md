# 🎯 Hệ thống Quản lý KPI - Công ty Nhân Kiệt

## ✅ Trạng thái: HOẠT ĐỘNG

### 🌐 URL Truy cập

**URL Production:** https://3000-ij9pq6vc2kegdr3doxjys-0e616f0a.sandbox.novita.ai

⚠️ **Lưu ý quan trọng:**
- Nếu bạn không vào được, vui lòng thử lại sau 5-10 giây (server cần thời gian khởi động)
- Đảm bảo URL đầy đủ có `https://` ở đầu
- Nếu vẫn lỗi, báo cho tôi biết thông báo lỗi cụ thể

---

## 🔑 Tài khoản đăng nhập

### PTGĐ (Phó Tổng Giám đốc)
```
Username: ptgd_binhduong
Password: 123456
```
```
Username: ptgd_hanoi
Password: 123456
```
```
Username: ptgd_mientrung
Password: 123456
```
```
Username: ptgd_hcm
Password: 123456
```

### GĐKD (Giám đốc Kinh doanh)
```
Username: gdkd_binhduong
Password: 123456
```
```
Username: gdkd_hanoi
Password: 123456
```
```
Username: gdkd_mientrung
Password: 123456
```
```
Username: gdkd_hcm
Password: 123456
```

### Trợ lý Kinh doanh
```
Username: tlkd_binhduong
Password: 123456
```
```
Username: tlkd_hanoi
Password: 123456
```
```
Username: tlkd_mientrung
Password: 123456
```
```
Username: tlkd_hcm
Password: 123456
```

### Giám sát
```
Username: gs_binhduong
Password: 123456
```
```
Username: gs_hanoi
Password: 123456
```
```
Username: gs_mientrung
Password: 123456
```
```
Username: gs_hcm
Password: 123456
```

---

## 📋 Hướng dẫn sử dụng

### Bước 1: Đăng nhập
1. Truy cập URL: https://3000-ij9pq6vc2kegdr3doxjys-0e616f0a.sandbox.novita.ai
2. Nhập username và password (ví dụ: `ptgd_binhduong` / `123456`)
3. Click nút "Đăng nhập"

### Bước 2: Nhập dữ liệu KPI
1. Sau khi đăng nhập, bạn sẽ thấy tab "Nhập KPI" (mặc định)
2. Chọn **Tháng** và **Năm** muốn nhập
3. Click "Tải dữ liệu"
4. Nhập giá trị thực tế vào từng chỉ số:
   - **Phần KPI**: Các chỉ số hiệu suất chính
   - **Phần Level**: Các chỉ số đánh giá cấp bậc
5. Click "Lưu dữ liệu KPI"
6. Hệ thống tự động tính toán % hoàn thành và điểm số

### Bước 3: Xem Dashboard
1. Click tab "Dashboard"
2. Chọn tháng/năm muốn xem
3. Click "Tải dữ liệu"
4. Xem kết quả KPI và Level của toàn công ty
5. Dữ liệu được chia theo 4 khối: Bình Dương, Hà Nội, Miền Trung, TP.HCM

---

## 🎨 Tính năng

### ✅ Đã hoàn thành
- ✓ Đăng nhập theo vai trò (16 tài khoản)
- ✓ Form nhập KPI theo tháng/năm
- ✓ Tự động tính % hoàn thành
- ✓ Tính điểm có trọng số
- ✓ Xếp loại KPI: Chưa đạt / Đạt chuẩn / Khá / Tốt
- ✓ Xếp loại Level: Xem xét lại / Level 1-5
- ✓ Dashboard tổng hợp toàn công ty
- ✓ Lọc theo tháng/năm
- ✓ Lưu trữ dữ liệu vĩnh viễn (Cloudflare D1)

### 📊 Cấu trúc KPI theo vị trí

#### PTGĐ (6 KPI + 4 Level)
**KPI:**
1. Số lượng GĐKD và PTGĐ có nhân sự kế thừa đạt chuẩn (15%)
2. Số lượng hoạt động tổ chức/năm (10%)
3. Số lượng ký mới khách hàng hạng A (10%)
4. Tỷ lệ GĐKD đạt chuẩn KPI (15%)
5. Tỷ lệ % doanh thu tăng trưởng (30%)
6. Tỷ lệ biên lợi nhuận gộp (20%)

**Level:**
1. Tổng số doanh thu (40%)
2. Tỷ lệ % doanh thu tăng trưởng (30%)
3. Số lượng cấp giám đốc đạt chuẩn (20%)
4. Số năm thâm niên (10%)

#### GĐKD (6 KPI + 4 Level)
**KPI:**
1. Số lượng nhân sự kế thừa đạt chuẩn (10%)
2. Số buổi đào tạo/Coaching (10%)
3. Tỷ lệ duy trì khách hàng cũ (10%)
4. Tỷ lệ % doanh thu tăng trưởng (30%)
5. Tỷ lệ khách hàng OS đạt 35k/người/ngày (20%)
6. Tỷ lệ giữ chân lao động (20%)

**Level:**
1. Tổng số doanh thu (40%)
2. Tỷ lệ % doanh thu tăng trưởng (30%)
3. Số lượng cấp trợ lý đạt chuẩn (20%)
4. Số năm thâm niên (10%)

#### Trợ lý Kinh doanh (6 KPI + 4 Level)
**KPI:**
1. Tỷ lệ nhân sự đạt chuẩn KPI (15%)
2. Tỷ lệ SOP hoàn thành (10%)
3. Tỷ lệ % doanh thu tăng trưởng (30%)
4. Tỷ lệ khách hàng OS đạt 35k/người/ngày (15%)
5. Số lượng trao đổi zalo/ngày (10%)
6. Tỷ lệ giữ chân lao động (20%)

**Level:**
1. Tổng số doanh thu (40%)
2. Tỷ lệ % doanh thu tăng trưởng (30%)
3. Số lượng trao đổi zalo/ngày (20%)
4. Số năm cống hiến (10%)

#### Giám sát (6 KPI + 4 Level)
**KPI:**
1. Số lượng lao động tư vấn/ngày (10%)
2. Số lượng lao động mới tuyển/tháng (40%)
3. Số lượng lao động quản lý/tháng (10%)
4. Số video post/ngày (10%)
5. Tỷ lệ tuân thủ SOP (10%)
6. Tỷ lệ giữ chân lao động (20%)

**Level:**
1. Số lượng lao động tư vấn/ngày (15%)
2. Số lượng lao động mới tuyển/tháng (50%)
3. Số lượng lao động quản lý/tháng (25%)
4. Số năm kinh nghiệm (10%)

---

## 📈 Công thức tính điểm

### % Hoàn thành
```
% Hoàn thành = (Giá trị thực tế / Giá trị chuẩn) × 100%
Maximum: 150%
```

### Điểm có trọng số
```
Điểm = (% Hoàn thành / 100) × Trọng số
```

### Tổng điểm KPI
```
Tổng điểm = Σ (Điểm có trọng số của tất cả KPI)
```

### Xếp loại KPI
- **Chưa đạt**: < 100%
- **Đạt chuẩn**: 100% - 119%
- **Khá**: 120% - 139%
- **Tốt**: ≥ 140%

### Xếp loại Level (thay đổi theo vị trí)
**PTGĐ:**
- Xem xét lại: < 50%
- Level 1: 50% - 100%
- Level 2: 101% - 130%
- Level 3: 131% - 155%
- Level 4: ≥ 155%

**GĐKD, Trợ lý KD:**
- Xem xét lại: < 50%
- Level 1: 50% - 80%
- Level 2: 81% - 100%
- Level 3: 101% - 120%
- Level 4: 121% - 140%
- Level 5: ≥ 140%

**Giám sát:**
- Xem xét lại: < 50%
- Level 1: 50% - 75%
- Level 2: 76% - 100%
- Level 3: 101% - 130%
- Level 4: 131% - 150%
- Level 5: ≥ 150%

---

## 🔧 Kỹ thuật

### Tech Stack
- **Backend**: Hono (Edge Framework)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages (ready)
- **PM2**: Process manager

### Database Schema
- `regions`: 4 khối vận hành
- `positions`: 4 vị trí
- `users`: 16 tài khoản
- `kpi_templates`: 40 mẫu KPI
- `kpi_data`: Dữ liệu KPI đã nhập
- `monthly_summary`: Tổng hợp theo tháng

### API Endpoints
```
POST   /api/login                          - Đăng nhập
GET    /api/kpi-templates/:positionId      - Lấy mẫu KPI
GET    /api/kpi-data/:userId/:year/:month  - Lấy dữ liệu KPI
POST   /api/kpi-data                       - Lưu KPI
GET    /api/summary/:userId/:year/:month   - Tổng hợp cá nhân
GET    /api/dashboard/:year/:month         - Dashboard toàn công ty
```

---

## 🚀 Tính năng sẽ phát triển

- [ ] Xuất báo cáo Excel
- [ ] Biểu đồ trực quan (Charts)
- [ ] So sánh KPI theo tháng
- [ ] Thông báo khi KPI không đạt
- [ ] Quản lý user (admin)
- [ ] Tùy chỉnh mẫu KPI
- [ ] Lịch sử thay đổi
- [ ] Mobile app

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng cung cấp:
1. Thông báo lỗi (nếu có)
2. Tài khoản đang dùng
3. Hành động đang thực hiện
4. Screenshot (nếu có thể)

---

## 📝 Ghi chú

- ⏰ Sandbox lifetime: 1 giờ (tự động gia hạn khi truy cập)
- 💾 Dữ liệu được lưu vĩnh viễn trong database
- 🔒 Mật khẩu mặc định: `123456` (nên đổi trong production)
- 🌍 Hỗ trợ tiếng Việt đầy đủ

**Phát triển bởi:** AI Assistant
**Ngày:** 26/12/2025
**Version:** 1.0.0
