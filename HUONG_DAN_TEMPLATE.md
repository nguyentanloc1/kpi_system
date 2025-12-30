# 📋 TEMPLATE TÀI KHOẢN HỆ THỐNG KPI

## 📁 File Template
**File CSV:** `TEMPLATE_TAI_KHOAN_HE_THONG.csv`

---

## 🏗️ CẤU TRÚC PHÂN CẤP

```
Công ty Nhân Kiệt
    ├── Bình Dương (67 người)
    │   ├── 1 PTGĐ (Phó Tổng Giám Đốc)
    │   ├── 1 GĐKD (Giám Đốc Kinh Doanh)
    │   ├── 2 TLKD (Trợ Lý Kinh Doanh)
    │   └── 63 Giám sát
    │
    ├── Hà Nội (17 người)
    │   ├── 1 PTGĐ
    │   ├── 1 GĐKD
    │   ├── 2 TLKD
    │   └── 13 Giám sát
    │
    ├── Miền Trung (18 người)
    │   ├── 1 PTGĐ
    │   ├── 1 GĐKD
    │   ├── 2 TLKD
    │   └── 14 Giám sát
    │
    └── Hồ Chí Minh (39 người)
        ├── 1 PTGĐ
        ├── 1 GĐKD
        ├── 2 TLKD
        └── 35 Giám sát

**TỔNG CỘNG: 141 tài khoản** (4 khu vực × 4 vị trí)
```

---

## 📊 PHÂN QUYỀN THEO VỊ TRÍ

### 1️⃣ **PTGĐ** (Phó Tổng Giám Đốc) - 4 người
- **Phạm vi**: Xem xếp hạng với 3 PTGĐ khác (toàn công ty)
- **Chức năng**:
  - Xem KPI/Level của 4 PTGĐ
  - So sánh hiệu suất giữa các khu vực
  - Dashboard tổng quan cấp cao

### 2️⃣ **GĐKD** (Giám Đốc Kinh Doanh) - 4 người
- **Phạm vi**: Xem xếp hạng với 3 GĐKD khác (toàn công ty)
- **Chức năng**:
  - Xem KPI/Level của 4 GĐKD
  - Quản lý TLKD và Giám sát trong khu vực
  - Dashboard hiệu suất khu vực

### 3️⃣ **TLKD** (Trợ Lý Kinh Doanh) - 8 người
- **Phạm vi**: Xem xếp hạng với TẤT CẢ TLKD toàn công ty (8 người)
- **Chức năng**:
  - Xem KPI/Level của 8 TLKD
  - Hỗ trợ GĐKD quản lý Giám sát
  - Dashboard toàn công ty theo vị trí

### 4️⃣ **Giám sát** - 125 người
- **Phạm vi**: Xem xếp hạng với TẤT CẢ Giám sát toàn công ty (125 người)
- **Chức năng**:
  - Xem KPI/Level của 125 Giám sát
  - Nhập KPI hàng ngày
  - Nhập Level hàng tháng
  - Dashboard biểu đồ tuyển dụng
  - Dashboard xếp hạng toàn công ty

---

## 📝 HƯỚNG DẪN SỬ DỤNG TEMPLATE

### **Bước 1: Mở File CSV**
- Mở file `TEMPLATE_TAI_KHOAN_HE_THONG.csv` bằng **Excel** hoặc **Google Sheets**
- File đã được sắp xếp theo:
  - **Khu vực**: Bình Dương → Hà Nội → Miền Trung → Hồ Chí Minh
  - **Chức vụ**: PTGĐ → GĐKD → TLKD → Giám sát

### **Bước 2: Điền Thông Tin**

| Cột | Tên | Hướng dẫn | Ví dụ |
|-----|-----|-----------|-------|
| A | STT | Tự động | 1, 2, 3... |
| B | Khu vực | Đã có sẵn | Bình Dương |
| C | Chức vụ | Đã có sẵn | Giám sát |
| D | **Họ và tên** | **VIẾT HOA CÓ DẤU** | **NGUYỄN VĂN A** |
| E | **Username** | **không dấu, viết thường** | **nguyenvana** |
| F | Password | Giữ mặc định | 123456 |
| G | Ngày bắt đầu | DD-MM-YYYY | 01-01-2020 |
| H | Ghi chú | Tùy chọn | Quản lý tại BD |

### **Bước 3: Quy Tắc Username**
✅ **ĐÚNG:**
- `nguyenvana` (không dấu, viết thường, không khoảng trắng)
- `tranthib` (ngắn gọn, dễ nhớ)
- `levanhung` (họ + tên đệm + tên)

❌ **SAI:**
- `Nguyễn Văn A` (có dấu, có khoảng trắng)
- `nguyen van a` (có khoảng trắng)
- `NguyenVanA` (viết hoa)

### **Bước 4: Lưu Ý Quan Trọng**
⚠️ **Username phải UNIQUE (duy nhất)**
- Không được trùng lặp trong toàn hệ thống
- Đề xuất: `[tên][họ]` hoặc `[tên][hodem]`
- Nếu trùng, thêm số: `nguyenvana`, `nguyenvana2`

🔒 **Password mặc định: 123456**
- **PHẢI ĐỔI** sau lần đăng nhập đầu tiên
- Chức năng "Đổi mật khẩu" trong hệ thống

📅 **Ngày bắt đầu**
- Định dạng: DD-MM-YYYY hoặc YYYY-MM-DD
- Mặc định: 01-01-2020

---

## 💾 IMPORT VÀO HỆ THỐNG

### **Phương án 1: Import CSV (Khuyến nghị)**
1. Lưu file CSV với encoding **UTF-8**
2. Vào hệ thống → Quản lý người dùng
3. Click "Import CSV"
4. Upload file và kiểm tra preview
5. Confirm import

### **Phương án 2: Tạo thủ công**
1. Đăng nhập với tài khoản **admin**
2. Vào "Quản lý người dùng"
3. Click "Thêm người dùng"
4. Điền thông tin theo template
5. Lặp lại cho tất cả users

### **Phương án 3: SQL Script** (Nâng cao)
```sql
INSERT INTO users (username, password, full_name, region_id, position_id, start_date)
VALUES 
  ('nguyenvana', '$2a$10$...', 'NGUYỄN VĂN A', 1, 4, '2020-01-01'),
  ('tranthib', '$2a$10$...', 'TRẦN THỊ B', 1, 4, '2020-01-01');
```

---

## 🔍 KIỂM TRA SAU KHI IMPORT

### **1. Đăng nhập thử**
- Username: `nguyenvana`
- Password: `123456`
- Kiểm tra phân quyền đúng chức vụ

### **2. Kiểm tra Dashboard**
- **PTGĐ**: Thấy 4 PTGĐ (toàn công ty)
- **GĐKD**: Thấy 4 GĐKD (toàn công ty)
- **TLKD**: Thấy 8 TLKD (toàn công ty)
- **Giám sát**: Thấy 125 Giám sát (toàn công ty)

### **3. Test chức năng**
- Nhập KPI
- Nhập Level
- Xem biểu đồ tuyển dụng
- Xem xếp hạng

---

## 📞 HỖ TRỢ

**Nếu gặp vấn đề:**
1. Kiểm tra username có trùng không
2. Kiểm tra khu vực, chức vụ đã đúng chưa
3. Thử đăng nhập với admin để kiểm tra
4. Xem log trong console

**Admin account:**
- Username: `admin`
- Password: `admin123`

---

## 📊 THỐNG KÊ TEMPLATE

| Khu vực | PTGĐ | GĐKD | TLKD | Giám sát | **Tổng** |
|---------|------|------|------|----------|----------|
| Bình Dương | 1 | 1 | 2 | 63 | **67** |
| Hà Nội | 1 | 1 | 2 | 13 | **17** |
| Miền Trung | 1 | 1 | 2 | 14 | **18** |
| Hồ Chí Minh | 1 | 1 | 2 | 35 | **39** |
| **TỔNG** | **4** | **4** | **8** | **125** | **141** |

---

## 🎯 TÍNH NĂNG HỆ THỐNG

### **Dashboard KPI/Level**
- Xếp hạng theo vị trí (toàn công ty)
- Top 3 có icon đặc biệt 🏆
- Highlight user hiện tại
- Hiển thị khu vực để phân biệt

### **Biểu đồ Tuyển dụng** (Giám sát)
- Cột màu xanh: Trên chuẩn (≥40)
- Cột màu đỏ: Dưới chuẩn (<40)
- Đường chuẩn đỏ: 40 lao động/tháng
- Thống kê theo khu vực

### **Phân quyền tự động**
- Tự động phân quyền theo position_id
- PTGĐ xem 4 PTGĐ
- GĐKD xem 4 GĐKD
- TLKD xem 8 TLKD
- Giám sát xem 125 Giám sát

---

**Ngày tạo:** 26/12/2024  
**Phiên bản:** 1.0  
**Hệ thống:** KPI Management System - Công ty Nhân Kiệt
