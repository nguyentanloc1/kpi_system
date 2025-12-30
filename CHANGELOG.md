# Changelog - Hệ thống KPI Công ty Nhân Kiệt

## [2.0.0] - 2025-12-26 - REDESIGN HOÀN TOÀN

### ✨ Tính năng mới

#### 1. Giao diện 3 tab riêng biệt
- **Tab "Nhập KPI"**: Form nhập 6 chỉ số KPI theo tháng/năm
- **Tab "Nhập Level"**: Hiển thị Level tự động điền từ KPI
- **Tab "Dashboard"**: Xem tổng hợp KPI/Level toàn công ty
- Thiết kế hiện đại: gradient backgrounds, animations, card layouts

#### 2. Tính năng Auto-fill Level (TẤT CẢ vị trí)
- ✅ Tự động sao chép dữ liệu từ KPI sang Level
- ✅ Tự động tính số năm kinh nghiệm từ ngày nhận việc
- ✅ Áp dụng cho: PTGĐ, GĐKD, Trợ lý KD, Giám sát
- ✅ Không cần nhập Level thủ công

#### 3. Trang Admin - Quản lý người dùng
- Tài khoản: `admin` / `admin123`
- Xem danh sách 16 người dùng
- Nhập/sửa ngày nhận việc cho từng người
- Tự động cập nhật số năm thâm niên

### 🔧 Cải tiến Backend

#### API mới
- `GET /api/admin/users` - Lấy danh sách người dùng
- `PUT /api/admin/users/:userId` - Cập nhật ngày nhận việc

#### Logic tự động
- Khi lưu KPI → tự động điền Level
- Tự động tính số năm kinh nghiệm từ start_date
- Tự động tính điểm và xếp loại Level

### 📊 Database Updates

#### Migration 0004: Add start_date
- Thêm cột `start_date` vào bảng `users`
- Cập nhật ngày nhận việc cho 16 người dùng

#### Migration 0005: Add admin
- Thêm tài khoản admin với quyền quản lý

### 🎨 UI/UX Improvements
- Gradient backgrounds cho mỗi tab
- Color-coded badges cho regions và positions
- Hover effects và transitions
- Loading states với spinner animations
- Success/error messages với icons
- Responsive design cho mobile

### 📝 Documentation
- Cập nhật README.md với tính năng mới
- Thêm hướng dẫn sử dụng chi tiết
- Bổ sung API documentation

---

## [1.0.0] - 2025-12-25 - PHIÊN BẢN ĐẦU TIÊN

### ✨ Tính năng ban đầu
- Hệ thống đăng nhập cho 16 người dùng (4 khối × 4 vị trí)
- Form nhập KPI và Level trong cùng 1 trang
- Tính toán tự động điểm KPI và Level
- Dashboard tổng hợp theo 4 khối vận hành
- Database với 40 KPI templates từ Excel

### 🛠️ Tech Stack
- Backend: Hono (Edge Framework)
- Frontend: Vanilla JavaScript + Tailwind CSS
- Database: Cloudflare D1 (SQLite)
- Deployment: Cloudflare Pages

---

## Tổng kết thay đổi

| Phiên bản | Tính năng chính | Số commits |
|-----------|-----------------|------------|
| 1.0.0 | Form KPI+Level cùng trang, không có admin | 15 |
| 2.0.0 | 3 tab riêng, auto-fill Level, trang admin | 8 |

**Total commits**: 23
**Lines of code**: ~3,500+ (backend + frontend)
**Database tables**: 6 (regions, positions, users, kpi_templates, kpi_data, monthly_summary)
