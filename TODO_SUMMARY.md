# 📋 TÓM TẮT YÊU CẦU CẦN THỰC HIỆN

## Yêu cầu từ người dùng:

### 1. Trang Admin quản lý ngày nhận việc ✅
- Admin đăng nhập với `admin / admin123`
- Xem danh sách 16 users
- Chỉnh sửa ngày nhận việc cho từng user
- Không hiển thị trên form KPI thường

### 2. Chia KPI/Level thành 2 tabs riêng 🔄
**Hiện tại**: Scroll dài, KPI ở trên, Level ở dưới  
**Yêu cầu mới**: 
```
[Tab KPI] [Tab Level]
```
- Click Tab KPI → Hiển thị form 6 chỉ số KPI
- Click Tab Level → Hiển thị 4 chỉ số Level (readonly, auto-fill)

### 3. Áp dụng auto-fill cho TẤT CẢ vị trí ✅
**Hiện tại**: Chỉ Giám sát  
**Yêu cầu mới**: Tất cả PTGĐ, GĐKD, Trợ lý KD, Giám sát

**Logic auto-fill**:
- Map KPI → Level theo tên hoặc thứ tự
- Chỉ số cuối cùng: Số năm kinh nghiệm/thâm niên (tự động tính)

### 4. Disable tất cả input Level ✅
- Tất cả vị trí: Level chỉ xem, không nhập
- Chú thích: "Tự động lấy từ KPI"

## Đã hoàn thành:
- ✅ Database có cột `start_date`
- ✅ 16 users có ngày nhận việc
- ✅ Admin account tạo xong
- ✅ Backend logic auto-fill Level (chỉ Giám sát)
- ✅ Frontend disable Level (chỉ Giám sát)

## Cần làm tiếp:
1. ⏳ Tạo trang Admin UI
2. ⏳ API để admin cập nhật start_date
3. ⏳ Sửa frontend: Tabs KPI/Level
4. ⏳ Mở rộng backend: Auto-fill cho tất cả vị trí
5. ⏳ Disable Level input cho tất cả vị trí

## Ước tính thời gian:
- Trang Admin: 30 phút
- Tabs UI: 20 phút  
- Backend auto-fill all: 15 phút
- Frontend disable all: 10 phút
**Tổng**: ~1.5 giờ

## Gợi ý đơn giản hóa:
Có thể làm từng bước, deploy và test:
1. Làm tabs KPI/Level trước (quan trọng nhất cho UX)
2. Mở rộng auto-fill cho tất cả
3. Trang Admin làm sau cùng (ít ưu tiên hơn)
