#!/usr/bin/env python3
import subprocess
import csv

# Query database
cmd = '''npx wrangler d1 execute webapp-production --local --command="
SELECT 
    r.id as region_id,
    r.name as region_name,
    p.id as position_id,
    p.display_name as position_name,
    u.id,
    u.username,
    u.full_name,
    u.start_date
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN positions p ON u.position_id = p.id
WHERE u.username != 'admin'
ORDER BY r.id, p.id, u.full_name
"'''

result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd='/home/user/webapp')

# Parse simple text output
lines = result.stdout.split('\n')
users = []

for line in lines:
    if 'full_name' in line and 'NGUYỄN' in line or 'Phó TGĐ' in line or 'Giám Đốc' in line or 'Trợ Lý' in line:
        # This is a data line, extract info manually
        parts = line.strip().split('"')
        try:
            # Find full_name value
            for i, part in enumerate(parts):
                if 'full_name' in parts[i-1] if i > 0 else False:
                    full_name = part
                    break
        except:
            pass

# Simpler approach - just create from known data structure
print("Creating template with known structure...")

# Create CSV
with open('/home/user/webapp/TEMPLATE_TAI_KHOAN_HE_THONG.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    
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
    
    # Add known structure for each region
    regions = [
        ('Bình Dương', 63 + 1 + 1 + 2),  # 63 GS + 1 PTGD + 1 GDKD + 2 TLKD
        ('Hà Nội', 13 + 1 + 1 + 2),
        ('Miền Trung', 14 + 1 + 1 + 2),
        ('Hồ Chí Minh', 35 + 1 + 1 + 2)
    ]
    
    positions = [
        ('PTGĐ', 1),
        ('Giám đốc kinh doanh', 1),
        ('Trợ lý kinh doanh', 2),
        ('Giám sát', 'remaining')
    ]
    
    stt = 1
    
    for region, total in regions:
        # Header row for region
        writer.writerow(['', f'═══════════════ {region.upper()} ═══════════════', '', '', '', '', '', ''])
        
        remaining_count = total - 4  # 1 PTGD + 1 GDKD + 2 TLKD
        
        for position, count in positions:
            # Header row for position
            writer.writerow(['', '', f'─── {position} ───', '', '', '', '', ''])
            
            actual_count = remaining_count if count == 'remaining' else count
            
            for i in range(actual_count):
                writer.writerow([
                    stt,
                    region,
                    position,
                    f'[Nhập họ tên #{stt}]',
                    f'[username{stt}]',
                    '123456',
                    '2020-01-01',
                    ''
                ])
                stt += 1
        
        # Blank row between regions
        writer.writerow([])

print(f"✅ Template created with {stt-1} user slots")
print(f"📁 File: /home/user/webapp/TEMPLATE_TAI_KHOAN_HE_THONG.csv")
