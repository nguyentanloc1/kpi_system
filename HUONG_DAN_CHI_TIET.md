# Hướng Dẫn Sử Dụng Chi Tiết - Hệ thống KPI Công ty Nhân Kiệt

## 📋 Mục Lục
1. [Giới thiệu](#giới-thiệu)
2. [Đăng nhập](#đăng-nhập)
3. [Quy trình nhập KPI](#quy-trình-nhập-kpi)
4. [Xem Level tự động](#xem-level-tự-động)
5. [Dashboard toàn công ty](#dashboard-toàn-công-ty)
6. [Quản lý người dùng (Admin)](#quản-lý-người-dùng-admin)
7. [FAQ](#faq)

---

## 🎯 Giới thiệu

Hệ thống KPI giúp quản lý và đánh giá hiệu suất làm việc của nhân viên tại 4 khối vận hành:
- 🔵 **Bình Dương**
- 🟢 **Hà Nội**
- 🟣 **Miền Trung**
- 🟠 **Hồ Chí Minh**

Mỗi khối có 4 cấp quản lý:
1. **PTGĐ** (Phó Tổng Giám đốc)
2. **GĐKD** (Giám đốc Kinh doanh)
3. **Trợ lý Kinh doanh**
4. **Giám sát**

---

## 🔐 Đăng nhập

### URL truy cập
```
https://3000-ij9pq6vc2kegdr3doxjys-0e616f0a.sandbox.novita.ai
```

### Tài khoản Admin
```
Username: admin
Password: admin123
```

**Chức năng Admin:**
- ✅ Quản lý danh sách 16 người dùng
- ✅ Nhập/sửa ngày nhận việc cho từng người

### Tài khoản Nhân viên

#### PTGĐ (Phó Tổng Giám đốc)
| Khối | Username | Password |
|------|----------|----------|
| Bình Dương | `ptgd_binhduong` | `123456` |
| Hà Nội | `ptgd_hanoi` | `123456` |
| Miền Trung | `ptgd_mientrung` | `123456` |
| TP.HCM | `ptgd_hcm` | `123456` |

#### GĐKD (Giám đốc Kinh doanh)
| Khối | Username | Password |
|------|----------|----------|
| Bình Dương | `gdkd_binhduong` | `123456` |
| Hà Nội | `gdkd_hanoi` | `123456` |
| Miền Trung | `gdkd_mientrung` | `123456` |
| TP.HCM | `gdkd_hcm` | `123456` |

#### Trợ lý Kinh doanh
| Khối | Username | Password |
|------|----------|----------|
| Bình Dương | `tlkd_binhduong` | `123456` |
| Hà Nội | `tlkd_hanoi` | `123456` |
| Miền Trung | `tlkd_mientrung` | `123456` |
| TP.HCM | `tlkd_hcm` | `123456` |

#### Giám sát
| Khối | Username | Password |
|------|----------|----------|
| Bình Dương | `gs_binhduong` | `123456` |
| Hà Nội | `gs_hanoi` | `123456` |
| Miền Trung | `gs_mientrung` | `123456` |
| TP.HCM | `gs_hcm` | `123456` |

---

## 📝 Quy trình nhập KPI

### Bước 1: Chọn Tab "Nhập KPI"

Sau khi đăng nhập, bạn sẽ thấy màn hình với 3 tab:
- 📝 **Nhập KPI** (Tab đầu tiên)
- ⭐ Nhập Level
- 📊 Dashboard

### Bước 2: Chọn tháng/năm

1. Chọn **Tháng** từ dropdown (1-12)
2. Chọn **Năm** từ dropdown
3. Click nút **"Tải dữ liệu"** 🔄

### Bước 3: Nhập giá trị KPI

Form hiển thị 6 chỉ số KPI với:
- 🔢 **Số thứ tự**: 1, 2, 3, 4, 5, 6
- 📋 **Tên KPI**: Chi tiết từng chỉ số
- ⚖️ **Trọng số**: Phần trăm đóng góp vào tổng điểm
- ✅ **Giá trị chuẩn**: Mức cần đạt

**Ví dụ KPI của Giám sát:**
1. Số lượng lao động tiềm năng tư vấn mỗi ngày (10%)
2. Số lượng lao động mới tuyển dụng nhận việc mỗi tháng (40%)
3. Số lượng lao động quản lý mỗi tháng (10%)
4. Số lượng video post lên kênh truyền thông mỗi ngày (10%)
5. Tỷ lệ % hoạt động tuân thủ kết quả theo SOP (10%)
6. Tỷ lệ giữ chân tổng người lao động OS/tổng mục tiêu OS (20%)

### Bước 4: Lưu dữ liệu

1. Nhập giá trị thực tế vào **từng ô input**
2. Click nút **"Lưu dữ liệu KPI"** 💾
3. Đợi thông báo:
   ```
   ✅ Lưu dữ liệu thành công! Dữ liệu Level đã được tự động điền.
   ```

### ⚙️ Hệ thống tự động thực hiện:
- ✅ Tính **% hoàn thành** = (Giá trị thực tế / Giá trị chuẩn) × 100%
- ✅ Tính **Điểm có trọng số** = (% hoàn thành / 100) × Trọng số
- ✅ Tính **Tổng điểm KPI**
- ✅ Xếp loại KPI: Chưa đạt / Đạt chuẩn / Khá / Tốt
- ✨ **Tự động điền Level** từ dữ liệu KPI
- ✨ **Tự động tính số năm kinh nghiệm** từ ngày nhận việc

---

## ⭐ Xem Level tự động

### Bước 1: Chuyển sang Tab "Nhập Level"

Click vào tab thứ 2: **"Nhập Level"** ⭐

### Bước 2: Xem dữ liệu Level

Form hiển thị 4 chỉ số Level với:
- 🪄 **Badge "Tự động điền"**: Dữ liệu đã được điền từ KPI
- 📊 **Giá trị thực tế**: Sao chép từ KPI tương ứng
- 📈 **% Hoàn thành**: Tự động tính toán
- 🎯 **Điểm có trọng số**: Tự động tính toán

### Bước 3: Xem tổng kết

Phần **"Tổng kết Level"** hiển thị:
- 🏆 **Tổng điểm Level**: Tổng các điểm có trọng số
- 🎖️ **Xếp loại**: Level 1 đến Level 5

**Xếp loại Level:**
- ❌ **Xem xét lại**: < 50%
- 🟨 **Level 1**: 50% - 80%
- 🟧 **Level 2**: 81% - 100%
- 🟦 **Level 3**: 101% - 120%
- 🟩 **Level 4**: 121% - 140%
- 🏆 **Level 5**: ≥ 140%

### 💡 Lưu ý quan trọng

> **Bạn KHÔNG cần nhập Level thủ công!**
> 
> - ✅ Chỉ cần nhập KPI ở Tab 1
> - ✅ Level sẽ tự động điền ở Tab 2
> - ✅ Số năm kinh nghiệm tự động tính từ ngày nhận việc

---

## 📊 Dashboard toàn công ty

### Bước 1: Chuyển sang Tab "Dashboard"

Click vào tab thứ 3: **"Dashboard"** 📊

### Bước 2: Chọn tháng/năm xem báo cáo

1. Chọn **Tháng** và **Năm**
2. Click nút **"Tải dữ liệu"** 🔄

### Bước 3: Xem báo cáo theo khối

Dashboard hiển thị dữ liệu của **toàn bộ 16 người** chia theo 4 khối:

#### 🔵 Khối Bình Dương
- 4 nhân viên: PTGĐ, GĐKD, Trợ lý KD, Giám sát
- Điểm KPI và xếp loại
- Điểm Level và xếp loại

#### 🟢 Khối Hà Nội
- 4 nhân viên
- Dữ liệu tương tự

#### 🟣 Khối Miền Trung
- 4 nhân viên
- Dữ liệu tương tự

#### 🟠 Khối Hồ Chí Minh
- 4 nhân viên
- Dữ liệu tương tự

### Cột dữ liệu hiển thị:
| Cột | Mô tả |
|-----|-------|
| **Họ tên** | Tên đầy đủ nhân viên |
| **Vị trí** | PTGĐ / GĐKD / Trợ lý KD / Giám sát |
| **Điểm KPI** | Tổng điểm KPI (0.000 - 1.500) |
| **Xếp loại KPI** | Badge màu: Chưa đạt / Đạt chuẩn / Khá / Tốt |
| **Điểm Level** | Tổng điểm Level (0.000 - 1.500) |
| **Xếp loại Level** | Badge màu: Level 1-5 / Xem xét lại |

---

## 👨‍💼 Quản lý người dùng (Admin)

### Đăng nhập Admin

```
Username: admin
Password: admin123
```

### Giao diện Admin

Sau khi đăng nhập, Admin sẽ thấy tab duy nhất:
- 👥 **Quản lý người dùng**

### Chức năng quản lý

#### Xem danh sách người dùng

Bảng hiển thị 16 người dùng với các cột:
- **ID**: Mã số nhân viên
- **Tên đăng nhập**: Username
- **Họ tên**: Tên đầy đủ
- **Khối**: Badge màu theo khối vận hành
- **Vị trí**: Badge màu theo cấp bậc
- **Ngày nhận việc**: Input date picker
- **Thao tác**: Nút "Lưu" 💾

#### Nhập/sửa ngày nhận việc

1. Tìm nhân viên cần cập nhật
2. Click vào ô **"Ngày nhận việc"**
3. Chọn ngày từ date picker
4. Click nút **"Lưu"** 💾
5. Đợi thông báo:
   ```
   ✅ Cập nhật thành công!
   ```

### ⚙️ Tự động tính số năm kinh nghiệm

Khi nhân viên lưu KPI, hệ thống sẽ:
1. Lấy **ngày nhận việc** từ database
2. Tính số năm đến thời điểm hiện tại
3. Tự động điền vào chỉ số Level cuối cùng
4. Tính điểm Level hoàn chỉnh

**Ví dụ:**
- Ngày nhận việc: `01/01/2022`
- Ngày hiện tại: `26/12/2025`
- Số năm kinh nghiệm: `3.98 năm` → làm tròn thành `3.98`

---

## ❓ FAQ

### 1. Tôi quên mật khẩu, làm sao?

**Đáp:** Liên hệ Admin để reset mật khẩu về `123456`.

### 2. Tại sao Level không hiển thị dữ liệu?

**Đáp:** Bạn cần nhập KPI trước. Level sẽ tự động điền sau khi lưu KPI.

### 3. Có thể sửa dữ liệu đã nhập không?

**Đáp:** Có! Chọn lại tháng/năm, nhập giá trị mới và click "Lưu" để cập nhật.

### 4. Dashboard không hiển thị dữ liệu?

**Đáp:** Kiểm tra:
- ✅ Đã chọn đúng tháng/năm chưa?
- ✅ Đã có người nhập KPI cho tháng đó chưa?
- ✅ Click nút "Tải dữ liệu" để refresh

### 5. Số năm kinh nghiệm không chính xác?

**Đáp:** 
- Kiểm tra Admin đã nhập đúng ngày nhận việc chưa
- Liên hệ Admin để cập nhật lại

### 6. Có thể xem KPI của người khác không?

**Đáp:** 
- ❌ Nhân viên chỉ xem được KPI của chính mình
- ✅ Tất cả có thể xem Dashboard (tổng hợp toàn công ty)
- ✅ Admin có thể xem danh sách người dùng

### 7. Điểm KPI tối đa là bao nhiêu?

**Đáp:** 
- Điểm tối đa: **1.500** (150%)
- Điểm chuẩn: **1.000** (100%)
- Điểm tối thiểu: **0.000** (0%)

### 8. Làm sao biết mình đạt mức nào?

**Xếp loại KPI:**
- 🔴 **Chưa đạt**: < 1.000 điểm (< 100%)
- 🟡 **Đạt chuẩn**: ≥ 1.000 điểm (≥ 100%)
- 🔵 **Khá**: ≥ 1.200 điểm (≥ 120%)
- 🟢 **Tốt**: ≥ 1.400 điểm (≥ 140%)

**Xếp loại Level:**
- 🔴 **Xem xét lại**: < 0.500 điểm (< 50%)
- 🟨 **Level 1**: 0.500 - 0.800 (50% - 80%)
- 🟧 **Level 2**: 0.810 - 1.000 (81% - 100%)
- 🟦 **Level 3**: 1.010 - 1.200 (101% - 120%)
- 🟩 **Level 4**: 1.210 - 1.400 (121% - 140%)
- 🏆 **Level 5**: ≥ 1.410 (≥ 140%)

### 9. Tại sao phải nhập theo tháng?

**Đáp:** 
- Theo dõi hiệu suất theo từng tháng
- So sánh xu hướng qua các tháng
- Đánh giá định kỳ để cải thiện

### 10. Hệ thống có lưu lịch sử không?

**Đáp:** Có! Mỗi lần lưu sẽ cập nhật database. Bạn có thể xem lại dữ liệu các tháng trước.

---

## 📞 Hỗ trợ

Nếu gặp vấn đề kỹ thuật, vui lòng liên hệ:
- 📧 **Email**: it@nhanket.com
- 📱 **Hotline**: 1900-xxxx
- 👨‍💼 **Admin**: Liên hệ Quản trị viên hệ thống

---

## 🎯 Mẹo sử dụng hiệu quả

1. ✅ **Nhập KPI đều đặn** vào đầu tháng
2. ✅ **Kiểm tra Level** để biết mức độ hoàn thành
3. ✅ **Xem Dashboard** để so sánh với đồng nghiệp
4. ✅ **Liên hệ Admin** nếu có thắc mắc về ngày nhận việc
5. ✅ **Lưu dữ liệu thường xuyên** để tránh mất thông tin

---

**Chúc bạn sử dụng hệ thống hiệu quả! 🚀**
