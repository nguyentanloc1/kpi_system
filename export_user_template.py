#!/usr/bin/env python3
"""
Script tạo template tài khoản với cấu trúc phân cấp đầy đủ
PTGĐ -> GĐKD -> TLKD -> Giám sát
"""
import subprocess
import csv
import json

def get_users_from_db():
    """Lấy danh sách users từ database"""
    cmd = '''npx wrangler d1 execute webapp-production --local --command="
SELECT 
    u.id,
    u.username,
    u.full_name,
    r.name as region_name,
    p.display_name as position_name,
    p.id as position_id,
    u.start_date
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN positions p ON u.position_id = p.id
WHERE u.username != 'admin'
ORDER BY r.id, p.id, u.full_name
" --json'''
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd='/home/user/webapp')
    
    # Parse JSON từ output
    lines = result.stdout.strip().split('\n')
    for line in lines:
        if '"results"' in line:
            # Tìm dòng chứa results và parse toàn bộ JSON
            json_start = result.stdout.find('{')
            if json_start >= 0:
                data = json.loads(result.stdout[json_start:])
                return data[0]['results']
    
    return []

def export_user_template():
    # Lấy dữ liệu từ database
    users = get_users_from_db()
    
    if not users:
        print("❌ Không có dữ liệu users")
        return
    
    # Tạo CSV file
    csv_filename = '/home/user/webapp/TEMPLATE_TAI_KHOAN_HE_THONG.csv'
    
    with open(csv_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile)
        
        # Header
        writer.writerow([
            'STT',
            'Khu vực',
            'Chức vụ',
            'Họ và tên',
            'Username (Tên đăng nhập)',
            'Password (Mật khẩu)',
            'Ngày bắt đầu',
            'Ghi chú'
        ])
        
        # Thêm dữ liệu
        stt = 1
        current_region = None
        current_position = None
        
        for user in users:
            # Thêm dòng phân cách khu vực
            if current_region != user['region_name']:
                if current_region is not None:
                    writer.writerow([])  # Dòng trống
                writer.writerow(['', f"═══════════════ {user['region_name'].upper()} ═══════════════", '', '', '', '', '', ''])
                current_region = user['region_name']
                current_position = None
            
            # Thêm dòng phân cách chức vụ
            if current_position != user['position_name']:
                writer.writerow(['', '', f"─── {user['position_name']} ───", '', '', '', '', ''])
                current_position = user['position_name']
            
            writer.writerow([
                stt,
                user['region_name'],
                user['position_name'],
                user['full_name'],
                user['username'],
                '123456',  # Default password
                user.get('start_date') or '2020-01-01',
                ''
            ])
            stt += 1
    
    print(f"\n{'='*100}")
    print(f"✅ TEMPLATE ĐÃ ĐƯỢC TẠO THÀNH CÔNG!")
    print(f"{'='*100}")
    print(f"📁 File: {csv_filename}")
    print(f"📊 Tổng số tài khoản: {len(users)}")
    print()
    
    # Thống kê theo khu vực và chức vụ
    stats = {}
    for user in users:
        region = user['region_name']
        position = user['position_name']
        
        if region not in stats:
            stats[region] = {}
        if position not in stats[region]:
            stats[region][position] = 0
        stats[region][position] += 1
    
    print(f"📈 THỐNG KÊ TÀI KHOẢN THEO KHU VỰC:")
    print(f"{'─'*100}")
    
    for region in ['Bình Dương', 'Hà Nội', 'Miền Trung', 'Hồ Chí Minh']:
        if region not in stats:
            continue
        
        print(f"\n🏢 {region}:")
        for position in ['PTGĐ', 'Giám đốc kinh doanh', 'Trợ lý kinh doanh', 'Giám sát']:
            count = stats[region].get(position, 0)
            if count > 0:
                print(f"   • {position}: {count} người")
        
        total = sum(stats[region].values())
        print(f"   ━━━ Tổng: {total} người")
    
    print(f"\n{'='*100}")
    print(f"📋 CẤU TRÚC PHÂN CẤP:")
    print(f"{'─'*100}")
    print(f"   1️⃣  PTGĐ (Phó Tổng Giám Đốc) - Quản lý toàn khu vực")
    print(f"        ↓")
    print(f"   2️⃣  GĐKD (Giám Đốc Kinh Doanh) - Quản lý đội nhóm khu vực")
    print(f"        ↓")
    print(f"   3️⃣  TLKD (Trợ Lý Kinh Doanh) - Hỗ trợ GĐKD")
    print(f"        ↓")
    print(f"   4️⃣  Giám sát - Quản lý lao động trực tiếp")
    print(f"{'='*100}")
    print()
    print(f"💡 HƯỚNG DẪN SỬ DỤNG:")
    print(f"   1. Mở file CSV bằng Excel/Google Sheets")
    print(f"   2. File đã được sắp xếp theo:")
    print(f"      • Khu vực: Bình Dương → Hà Nội → Miền Trung → Hồ Chí Minh")
    print(f"      • Chức vụ: PTGĐ → GĐKD → TLKD → Giám sát")
    print(f"   3. Chỉnh sửa thông tin theo nhu cầu:")
    print(f"      • Họ tên: Viết HOA có dấu")
    print(f"      • Username: Không dấu, viết thường, không khoảng trắng")
    print(f"      • Password: Mặc định 123456 (nhớ đổi sau lần đăng nhập đầu)")
    print(f"   4. Lưu file và dùng làm template để import")
    print(f"{'='*100}\n")
    
    # Hiển thị mẫu cho mỗi khu vực
    print(f"📋 MẪU TÀI KHOẢN CHO MỖI KHU VỰC:")
    print(f"{'─'*100}")
    
    for region in ['Bình Dương', 'Hà Nội', 'Miền Trung', 'Hồ Chí Minh']:
        region_users = [u for u in users if u['region_name'] == region]
        if not region_users:
            continue
        
        print(f"\n🏢 {region} ({len(region_users)} người):")
        
        for position in ['PTGĐ', 'Giám đốc kinh doanh', 'Trợ lý kinh doanh', 'Giám sát']:
            position_users = [u for u in region_users if u['position_name'] == position]
            if position_users:
                print(f"\n   {position} ({len(position_users)} người):")
                # Hiển thị 3 người đầu tiên
                for u in position_users[:3]:
                    print(f"      • {u['full_name']} - {u['username']}")
                if len(position_users) > 3:
                    print(f"      • ... và {len(position_users) - 3} người khác")
    
    print(f"\n{'='*100}\n")

if __name__ == '__main__':
    export_user_template()
