#!/usr/bin/env python3
"""
Populate database via API instead of direct SQL
This respects all constraints and uses the existing POST /api/admin/users endpoint
"""

import requests
import json
import time

BASE_URL = "http://localhost:3000"
API_CREATE_USER = f"{BASE_URL}/api/admin/users"

# Login as admin first
session = requests.Session()

# Region mapping
regions = {
    'bd': {'id': 1, 'name': 'Bình Dương'},
    'hn': {'id': 2, 'name': 'Hà Nội'},
    'mt': {'id': 3, 'name': 'Miền Trung'},
    'hcm': {'id': 4, 'name': 'Hồ Chí Minh'}
}

# PTGĐ list
ptgd_list = [
    {'name': 'Nguyễn Quốc Trung', 'region': 'bd', 'username': 'ptgd_binhduong'},
    {'name': 'Đỗ Đức Chí', 'region': 'hn', 'username': 'ptgd_hanoi'},
    {'name': 'Vũ Quang Hoan', 'region': 'hcm', 'username': 'ptgd_hochiminh'},
    {'name': 'Lê Thị Bích Hạnh', 'region': 'mt', 'username': 'ptgd_mientrung'}
]

def create_user(username, password, full_name, region_id, position_id, start_date, manager_id=None):
    """Create user via API"""
    payload = {
        'username': username,
        'password': password,
        'fullName': full_name,
        'regionId': region_id,
        'positionId': position_id,
        'startDate': start_date,
        'managerId': manager_id
    }
    
    try:
        response = session.post(API_CREATE_USER, json=payload)
        if response.status_code == 200:
            data = response.json()
            return data.get('userId')
        else:
            print(f"❌ Failed to create {username}: {response.text[:100]}")
            return None
    except Exception as e:
        print(f"❌ Error creating {username}: {e}")
        return None

def generate_name(index):
    """Generate Vietnamese full name"""
    surnames = ['Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Võ', 'Đặng', 'Bùi', 'Đỗ',
                'Hồ', 'Ngô', 'Dương', 'Lý', 'Vương', 'Đinh', 'Mai', 'Lâm', 'Tạ', 'Cao']
    
    middle_names = ['Văn', 'Thị', 'Công', 'Minh', 'Đức', 'Quốc', 'Hữu', 'Thanh', 'Ngọc', 'Anh']
    
    given_names = ['An', 'Bình', 'Chi', 'Dung', 'Giang', 'Hà', 'Hương', 'Khánh', 'Linh', 'Mai',
                   'Nam', 'Oanh', 'Phúc', 'Quỳnh', 'Sơn', 'Trang', 'Uyên', 'Vân', 'Xuân', 'Yến']
    
    surname = surnames[index % len(surnames)]
    middle = middle_names[index % len(middle_names)]
    given = given_names[index % len(given_names)]
    return f"{surname} {middle} {given}"

def main():
    print("🚀 Starting user creation via API...")
    print(f"📍 Target: {BASE_URL}")
    print()
    
    # ===== 1. CREATE 4 PTGĐ =====
    print("=" * 80)
    print("1. CREATING 4 PTGĐ...")
    print("=" * 80)
    
    ptgd_ids = {}
    for ptgd in ptgd_list:
        region_id = regions[ptgd['region']]['id']
        user_id = create_user(
            username=ptgd['username'],
            password='123456',
            full_name=ptgd['name'],
            region_id=region_id,
            position_id=1,  # PTGĐ
            start_date='2020-01-15',
            manager_id=None
        )
        
        if user_id:
            ptgd_ids[ptgd['region']] = user_id
            print(f"✅ Created PTGĐ {regions[ptgd['region']]['name']}: {ptgd['username']} (ID: {user_id})")
        else:
            print(f"❌ Failed to create PTGĐ {ptgd['username']}")
            return
        
        time.sleep(0.1)
    
    print()
    
    # ===== 2. CREATE 16 GĐKD =====
    print("=" * 80)
    print("2. CREATING 16 GĐKD (4 per PTGĐ)...")
    print("=" * 80)
    
    gdkd_ids = {}
    gdkd_count = 0
    
    for region_key in ['bd', 'hn', 'hcm', 'mt']:
        region = regions[region_key]
        gdkd_ids[region_key] = []
        
        print(f"\n📌 Creating GĐKD for {region['name']}...")
        
        for i in range(4):
            username = f"gdkd_{region_key}_{i+1:02d}"
            full_name = generate_name(gdkd_count)
            
            user_id = create_user(
                username=username,
                password='123456',
                full_name=full_name,
                region_id=region['id'],
                position_id=2,  # GĐKD
                start_date=f"2020-{5+i:02d}-01",
                manager_id=ptgd_ids[region_key]
            )
            
            if user_id:
                gdkd_ids[region_key].append(user_id)
                print(f"  ✅ {username} (ID: {user_id})")
            else:
                print(f"  ❌ Failed: {username}")
            
            gdkd_count += 1
            time.sleep(0.05)
    
    print()
    
    # ===== 3. CREATE 64 TLKD =====
    print("=" * 80)
    print("3. CREATING 64 TLKD (4 per GĐKD)...")
    print("=" * 80)
    
    tlkd_ids = {}
    tlkd_count = 0
    month_counter = 1
    
    for region_key in ['bd', 'hn', 'hcm', 'mt']:
        region = regions[region_key]
        tlkd_ids[region_key] = []
        
        print(f"\n📌 Creating TLKD for {region['name']}...")
        
        for gdkd_idx, gdkd_id in enumerate(gdkd_ids[region_key]):
            tlkd_ids[region_key].append([])
            
            for i in range(4):
                username = f"tlkd_{region_key}_{gdkd_idx+1:02d}_{i+1:02d}"
                full_name = generate_name(tlkd_count)
                
                year = 2021 + (month_counter // 12)
                month = (month_counter % 12) + 1
                
                user_id = create_user(
                    username=username,
                    password='123456',
                    full_name=full_name,
                    region_id=region['id'],
                    position_id=3,  # TLKD
                    start_date=f"{year}-{month:02d}-{(i+1)*10:02d}",
                    manager_id=gdkd_id
                )
                
                if user_id:
                    tlkd_ids[region_key][-1].append(user_id)
                    print(f"  ✅ {username} (ID: {user_id})", end='\r')
                else:
                    print(f"  ❌ Failed: {username}")
                
                tlkd_count += 1
                month_counter += 1
                time.sleep(0.05)
        
        print()  # New line after each region
    
    print()
    
    # ===== 4. CREATE 320 GIÁM SÁT =====
    print("=" * 80)
    print("4. CREATING 320 GIÁM SÁT (5 per TLKD)...")
    print("=" * 80)
    
    gs_count = 1
    year = 2022
    month = 10
    day = 20
    
    for region_key in ['bd', 'hn', 'hcm', 'mt']:
        region = regions[region_key]
        print(f"\n📌 Creating Giám sát for {region['name']}...")
        
        for gdkd_idx, gdkd_tlkd_list in enumerate(tlkd_ids[region_key]):
            for tlkd_idx, tlkd_id in enumerate(gdkd_tlkd_list):
                for i in range(5):
                    username = f"gs_{region_key}_{gdkd_idx+1:02d}_{tlkd_idx+1:02d}_{i+1:02d}"
                    full_name = f"Test {gs_count} Giám sát"
                    
                    user_id = create_user(
                        username=username,
                        password='123456',
                        full_name=full_name,
                        region_id=region['id'],
                        position_id=4,  # Giám sát
                        start_date=f"{year}-{month:02d}-{day:02d}",
                        manager_id=tlkd_id
                    )
                    
                    if user_id:
                        print(f"  ✅ {gs_count}/320 {username}", end='\r')
                    else:
                        print(f"  ❌ Failed: {username} (count: {gs_count})")
                    
                    gs_count += 1
                    
                    # Increment date
                    day += 10
                    if day > 28:
                        day = 1
                        month += 1
                        if month > 12:
                            month = 1
                            year += 1
                    
                    time.sleep(0.02)
        
        print()  # New line after each region
    
    print()
    print("=" * 80)
    print(f"✅ COMPLETED! Created {gs_count - 1 + 64 + 16 + 4} users")
    print("   - 4 PTGĐ")
    print("   - 16 GĐKD")
    print("   - 64 TLKD")
    print("   - 320 Giám sát")
    print("=" * 80)

if __name__ == '__main__':
    main()
