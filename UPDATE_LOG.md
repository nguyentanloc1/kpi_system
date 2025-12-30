# ✨ CẬP NHẬT MỚI: Tự động điền Level cho Giám sát

## 🎯 Tính năng mới (26/12/2025)

### Dành riêng cho vị trí **Giám sát**:

#### ✅ 1. Tự động copy từ KPI sang Level
Khi Giám sát nhập các chỉ số KPI, hệ thống sẽ **tự động copy** sang phần Level tương ứng:

- **KPI 1** → **Level 1**: Số lượng lao động tiềm năng tư vấn mỗi ngày
- **KPI 2** → **Level 2**: Số lượng lao động mới tuyển dụng nhận việc mỗi tháng  
- **KPI 3** → **Level 3**: Số lượng lao động quản lý mỗi tháng

➡️ **Giám sát chỉ cần nhập KPI, không cần nhập lại ở phần Level!**

#### ✅ 2. Tự động tính số năm kinh nghiệm
**Level 4: Số năm kinh nghiệm** được tính tự động từ ngày nhận việc đến hiện tại.

Ví dụ:
- Ngày nhận việc: 01/01/2022
- Hôm nay: 26/12/2025
- Số năm kinh nghiệm: **~3.98 năm** (tự động)

#### ✅ 3. Giao diện thân thiện
- ✨ Phần Level có badge "Tự động điền"
- 🔒 Các ô input Level bị **disabled** (màu xám)
- 💡 Chú thích rõ ràng: "Tự động lấy từ KPI" / "Tự động tính từ ngày nhận việc"

---

## 🔑 Tài khoản Giám sát để test

### Test với các tài khoản sau:

```
Username: gs_binhduong
Password: 123456
Ngày nhận việc: 01/01/2022 → ~3 năm kinh nghiệm
```

```
Username: gs_hanoi
Password: 123456
Ngày nhận việc: 01/01/2023 → ~2 năm kinh nghiệm
```

```
Username: gs_mientrung
Password: 123456
Ngày nhận việc: 01/01/2021 → ~4 năm kinh nghiệm
```

```
Username: gs_hcm
Password: 123456
Ngày nhận việc: 01/06/2022 → ~3.5 năm kinh nghiệm
```

---

## 📋 Hướng dẫn sử dụng cho Giám sát

### Bước 1: Đăng nhập
Dùng một trong 4 tài khoản Giám sát ở trên

### Bước 2: Chọn tháng/năm
Chọn tháng và năm cần nhập KPI

### Bước 3: Nhập CHƯONLY KPI (6 chỉ số)
Chỉ cần nhập 6 chỉ số KPI:
1. Số lượng lao động tiềm năng tư vấn mỗi ngày
2. Số lượng lao động mới tuyển dụng nhận việc mỗi tháng
3. Số lượng lao động quản lý mỗi tháng
4. Số lượng video post lên kênh truyền thông mỗi ngày
5. Tỷ lệ % hoạt động tuân thủ kết quả theo SOP
6. Tỷ lệ giữ chân tổng người lao động OS/tổng mục tiêu OS

### Bước 4: Click "Lưu dữ liệu KPI"
Hệ thống sẽ tự động:
- ✅ Copy 3 chỉ số đầu từ KPI sang Level
- ✅ Tính số năm kinh nghiệm
- ✅ Tính điểm tổng KPI và Level
- ✅ Xếp loại tự động

### Bước 5: Kiểm tra
Sau khi lưu, scroll xuống phần **Chỉ số Level** để xem dữ liệu đã tự động điền!

---

## 🎨 Giao diện mới

### Phần Level của Giám sát
- **Badge vàng**: "🪄 Tự động điền" ngay trên tiêu đề
- **Input disabled**: Màu xám, không thể chỉnh sửa
- **Icons thông báo**: 
  - 💡 "Tự động lấy từ KPI" (3 chỉ số đầu)
  - 💡 "Tự động tính từ ngày nhận việc" (số năm kinh nghiệm)

---

## 💾 Database đã cập nhật

Đã thêm cột mới vào bảng `users`:
- `start_date`: Ngày nhận việc (DATE)

Tất cả 16 users đã có ngày nhận việc:
- PTGĐ: 2018-01-01 (7 năm thâm niên)
- GĐKD: 2020-01-01 (5 năm thâm niên)
- Trợ lý KD: 2022-01-01 (3 năm thâm niên)
- Giám sát: Khác nhau (2-4 năm)

---

## 🚀 URL truy cập

**https://3000-ij9pq6vc2kegdr3doxjys-0e616f0a.sandbox.novita.ai**

---

## ⚙️ Các vị trí khác (PTGĐ, GĐKD, Trợ lý KD)

Các vị trí khác **KHÔNG thay đổi**, vẫn nhập Level thủ công như trước.

Chỉ riêng **Giám sát** có tính năng tự động điền!

---

## 🔧 Kỹ thuật

### Backend Logic:
```javascript
// Khi Giám sát submit KPI:
1. Lưu dữ liệu KPI bình thường
2. Tự động copy 3 KPI đầu → 3 Level đầu
3. Tính số năm từ start_date → Level 4
4. Tính tổng điểm và xếp loại
```

### Frontend:
```javascript
// Kiểm tra position_id
if (currentUser.position_id === 4) {
  // Disable tất cả input Level
  // Hiển thị badge "Tự động điền"
  // Thêm chú thích cho từng ô
}
```

---

## 📝 Lưu ý quan trọng

1. ✅ **Chỉ áp dụng cho Giám sát** (position_id = 4)
2. ✅ **Backend tự động xử lý** khi lưu KPI
3. ✅ **Frontend hiển thị readonly** để user biết là auto
4. ✅ **Số năm kinh nghiệm** cập nhật theo thời gian thực

---

**Cập nhật**: 26/12/2025 - 15:30  
**Version**: 1.2.0 (Auto-fill Level for Giám sát)  
**Trạng thái**: ✅ HOẠT ĐỘNG
