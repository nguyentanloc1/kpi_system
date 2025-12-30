# Hệ thống Quản lý KPI - Công ty Nhân Kiệt

## Mô tả dự án

Hệ thống quản lý KPI (Key Performance Indicators) cho công ty Nhân Kiệt, hỗ trợ 4 khối vận hành (Bình Dương, Hà Nội, Miền Trung, Hồ Chí Minh) với 4 cấp bậc quản lý.

## Tính năng chính

### ✅ Đã hoàn thành

1. **Hệ thống đăng nhập**
   - Xác thực người dùng theo tài khoản
   - Phân quyền theo vị trí và khối vận hành
   - 16 tài khoản nhân viên + 1 tài khoản Admin
   - Tự động phân quyền chức năng theo vai trò

2. **Giao diện 3 tab riêng biệt (cho nhân viên)**
   - **Tab "Nhập KPI"**: Form nhập các chỉ số KPI theo tháng/năm
   - **Tab "Nhập Level"**: Hiển thị Level tự động điền từ KPI
   - **Tab "Dashboard"**: Xem tổng hợp KPI/Level toàn công ty
   - Thiết kế hiện đại với gradient, animations, responsive

3. **Tính năng Auto-fill Level (TẤT CẢ vị trí)**
   - ✨ **Tự động sao chép** dữ liệu từ KPI sang Level
   - ✨ **Tự động tính số năm kinh nghiệm** từ ngày nhận việc
   - ✨ **Không cần nhập Level thủ công** - chỉ cần nhập KPI
   - Áp dụng cho: PTGĐ, GĐKD, Trợ lý KD, Giám sát

4. **Trang Admin - Quản lý người dùng**
   - 🔐 Dành riêng cho tài khoản **admin** / **admin123**
   - Xem danh sách 16 người dùng (theo khối và vị trí)
   - **Nhập/sửa ngày nhận việc** cho từng người
   - Tự động tính số năm thâm niên khi lưu KPI

5. **Quản lý KPI theo vị trí**
   - **PTGĐ (Phó Tổng Giám đốc)**: 6 chỉ số KPI, 4 chỉ số Level
   - **GĐKD (Giám đốc Kinh doanh)**: 6 chỉ số KPI, 4 chỉ số Level
   - **Trợ lý Kinh doanh**: 6 chỉ số KPI, 4 chỉ số Level
   - **Giám sát**: 6 chỉ số KPI, 4 chỉ số Level

6. **Tính toán tự động**
   - Tổng điểm KPI (max 150%)
   - Xếp loại KPI: Chưa đạt / Đạt chuẩn / Khá / Tốt
   - Tổng điểm Level
   - Xếp loại Level: Xem xét lại / Level 1-5

7. **Dashboard tổng hợp**
   - Xem KPI và Level của toàn công ty
   - Phân nhóm theo 4 khối vận hành
   - Hiển thị điểm số và xếp loại
   - Lọc theo tháng/năm

## Cấu trúc dữ liệu

### Database (Cloudflare D1)

- **regions**: 4 khối vận hành (Bình Dương, Hà Nội, Miền Trung, TP.HCM)
- **positions**: 4 vị trí (PTGĐ, GĐKD, Trợ lý KD, Giám sát)
- **users**: 16 tài khoản người dùng
- **kpi_templates**: 40 mẫu KPI theo từng vị trí (20 KPI + 20 Level)
- **kpi_data**: Dữ liệu KPI nhập vào
- **monthly_summary**: Tổng hợp điểm KPI và Level theo tháng

### API Endpoints

```
POST   /api/login                               - Đăng nhập
GET    /api/kpi-templates/:positionId           - Lấy mẫu KPI theo vị trí
GET    /api/kpi-data/:userId/:year/:month       - Lấy dữ liệu KPI đã nhập
POST   /api/kpi-data                            - Lưu dữ liệu KPI (auto-fill Level)
GET    /api/summary/:userId/:year/:month        - Lấy tổng hợp KPI/Level
GET    /api/dashboard/:year/:month              - Dashboard toàn công ty
GET    /api/admin/users                         - Lấy danh sách người dùng (admin)
PUT    /api/admin/users/:userId                 - Cập nhật ngày nhận việc (admin)
```

## Hướng dẫn sử dụng

### 1. Đăng nhập Admin

**Tài khoản Admin:**
- Username: `admin`
- Password: `admin123`

**Chức năng Admin:**
- Quản lý danh sách 16 người dùng
- Nhập/sửa **ngày nhận việc** cho từng người
- Hệ thống sẽ tự động tính số năm kinh nghiệm

### 2. Đăng nhập nhân viên

Sử dụng một trong 16 tài khoản mẫu:

**PTGĐ:**
- `ptgd_binhduong` / `123456`
- `ptgd_hanoi` / `123456`
- `ptgd_mientrung` / `123456`
- `ptgd_hcm` / `123456`

**Giám đốc Kinh doanh:**
- `gdkd_binhduong` / `123456`
- `gdkd_hanoi` / `123456`
- `gdkd_mientrung` / `123456`
- `gdkd_hcm` / `123456`

**Trợ lý Kinh doanh:**
- `tlkd_binhduong` / `123456`
- `tlkd_hanoi` / `123456`
- `tlkd_mientrung` / `123456`
- `tlkd_hcm` / `123456`

**Giám sát:**
- `gs_binhduong` / `123456`
- `gs_hanoi` / `123456`
- `gs_mientrung` / `123456`
- `gs_hcm` / `123456`

### 3. Nhập KPI (Tab 1)

1. Chọn **tháng/năm** cần nhập
2. Click **"Tải dữ liệu"** để load form KPI
3. Nhập giá trị thực tế vào **6 chỉ số KPI**
4. Click **"Lưu dữ liệu KPI"**
5. ✨ Hệ thống tự động:
   - Tính % hoàn thành và điểm số
   - **Tự động điền Level từ KPI đã nhập**
   - Tính số năm kinh nghiệm từ ngày nhận việc

### 4. Xem Level (Tab 2)

1. Chuyển sang tab **"Nhập Level"**
2. Chọn tháng/năm và click **"Tải dữ liệu"**
3. Xem Level đã được tự động điền:
   - ✅ **Giá trị thực tế** (từ KPI)
   - ✅ **% Hoàn thành** (tự động tính)
   - ✅ **Điểm có trọng số** (tự động tính)
4. Xem tổng kết điểm Level và xếp loại

### 5. Xem Dashboard (Tab 3)

1. Chuyển sang tab **"Dashboard"**
2. Chọn tháng/năm muốn xem
3. Xem kết quả KPI và Level của **toàn công ty**
4. Dữ liệu được phân nhóm theo 4 khối vận hành

## URLs

- **Development (Local)**: https://3000-ij9pq6vc2kegdr3doxjys-0e616f0a.sandbox.novita.ai
- **Production**: Sẽ deploy lên Cloudflare Pages

## Tech Stack

- **Backend**: Hono (Edge Framework)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages
- **Runtime**: Cloudflare Workers

## Công thức tính điểm

### Điểm KPI
```
% Hoàn thành = (Giá trị thực tế / Giá trị chuẩn) × 100% (max 150%)
Điểm có trọng số = (% Hoàn thành / 100) × Trọng số
Tổng điểm KPI = Σ Điểm có trọng số
```

### Xếp loại KPI
- **Chưa đạt**: < 100%
- **Đạt chuẩn**: ≥ 100%
- **Khá**: ≥ 120%
- **Tốt**: ≥ 140%

### Xếp loại Level
- **Xem xét lại**: < 50%
- **Level 1**: 50% - 80%
- **Level 2**: 81% - 100%
- **Level 3**: 101% - 120%
- **Level 4**: 121% - 140%
- **Level 5**: ≥ 140%

(Ghi chú: Công thức có thể thay đổi theo từng vị trí)

## Cài đặt và Chạy Local

```bash
# Clone repository
git clone <repository-url>
cd webapp

# Cài đặt dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Build project
npm run build

# Start development server
npm run dev:sandbox
# hoặc dùng PM2:
pm2 start ecosystem.config.cjs

# Test
curl http://localhost:3000
```

## Deploy lên Cloudflare Pages

```bash
# Tạo D1 database trên Cloudflare
npx wrangler d1 create webapp-production

# Cập nhật database_id trong wrangler.jsonc

# Apply migrations
npm run db:migrate:prod

# Deploy
npm run deploy:prod
```

## Tính năng sẽ phát triển

- [ ] Xuất báo cáo Excel
- [ ] Biểu đồ trực quan hóa dữ liệu KPI
- [ ] So sánh KPI giữa các tháng
- [ ] Thông báo khi KPI không đạt chuẩn
- [ ] Tùy chỉnh mẫu KPI theo công ty
- [ ] Lịch sử thay đổi dữ liệu KPI
- [ ] Phân tích xu hướng KPI theo thời gian

## Cấu trúc thư mục

```
webapp/
├── src/
│   └── index.tsx           # Backend API (Hono)
├── public/
│   └── static/
│       └── app.js          # Frontend JavaScript
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_kpi_templates.sql
│   ├── 0003_sample_users.sql
│   ├── 0004_add_start_date.sql
│   └── 0005_add_admin.sql
├── ecosystem.config.cjs    # PM2 configuration
├── wrangler.jsonc          # Cloudflare configuration
├── package.json
└── README.md
```

## Giấy phép

Thuộc quyền sở hữu của Công ty Nhân Kiệt

## Liên hệ

Để được hỗ trợ hoặc đóng góp ý kiến, vui lòng liên hệ bộ phận IT của công ty.
