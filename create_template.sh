#!/bin/bash

# Export users to CSV
echo "Exporting users to CSV..."

# Create CSV header
echo "STT,Khu vực,Chức vụ,Họ và tên,Username (Tên đăng nhập),Password (Mật khẩu),Ngày bắt đầu,Ghi chú" > TEMPLATE_TAI_KHOAN_HE_THONG.csv

# Get data and convert to CSV
npx wrangler d1 execute webapp-production --local --command="
SELECT 
    ROW_NUMBER() OVER (ORDER BY r.id, p.id, u.full_name) as stt,
    r.name as region_name,
    p.display_name as position_name,
    u.full_name,
    u.username,
    '123456' as password,
    u.start_date,
    '' as note
FROM users u
LEFT JOIN regions r ON u.region_id = r.id
LEFT JOIN positions p ON u.position_id = p.id
WHERE u.username != 'admin'
ORDER BY r.id, p.id, u.full_name
" 2>&1 | grep -A 500 '"stt"' | python3 << 'PYTHON'
import sys
import json
import csv

# Read all input
content = sys.stdin.read()

# Find JSON data
try:
    # Find first { and parse from there
    start = content.find('[{')
    if start < 0:
        start = content.find('{')
    
    if start >= 0:
        # Try to find complete JSON
        json_str = content[start:]
        
        # Simple extraction - find the results array
        results_start = content.find('"results":')
        if results_start >= 0:
            # Extract from results to the end of array
            results_str = content[results_start + 10:]  # Skip '"results":'
            
            # Find the array
            array_start = results_str.find('[')
            if array_start >= 0:
                results_str = results_str[array_start:]
                
                # Find matching ]
                depth = 0
                end = 0
                for i, c in enumerate(results_str):
                    if c == '[':
                        depth += 1
                    elif c == ']':
                        depth -= 1
                        if depth == 0:
                            end = i + 1
                            break
                
                if end > 0:
                    data = json.loads(results_str[:end])
                    
                    # Write CSV
                    writer = csv.writer(sys.stdout)
                    for row in data:
                        writer.writerow([
                            row['stt'],
                            row['region_name'],
                            row['position_name'],
                            row['full_name'],
                            row['username'],
                            row['password'],
                            row['start_date'],
                            row['note']
                        ])
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
PYTHON
>> TEMPLATE_TAI_KHOAN_HE_THONG.csv

echo "✅ Template created: TEMPLATE_TAI_KHOAN_HE_THONG.csv"
