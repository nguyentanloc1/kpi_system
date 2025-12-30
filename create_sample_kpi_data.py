#!/usr/bin/env python3
"""
Generate sample KPI data for testing Dashboard
Creates KPI data for 20 random users across different positions
"""

import requests
import random
from datetime import datetime

BASE_URL = "http://localhost:3000"

# Sample users from different positions
sample_users = [
    # PTGĐ
    {"id": 20, "name": "Nguyễn Quốc Trung", "position": "PTGĐ", "region": "Bình Dương"},
    
    # GĐKD
    {"id": 24, "name": "Trần Văn An", "position": "GĐKD", "region": "Bình Dương"},
    {"id": 28, "name": "Huỳnh Đức Giang", "position": "GĐKD", "region": "Hà Nội"},
    {"id": 32, "name": "Lê Văn Ích", "position": "GĐKD", "region": "HCM"},
    
    # TLKD
    {"id": 40, "name": "Bùi Văn Anh", "position": "TLKD", "region": "Bình Dương"},
    {"id": 41, "name": "Cao Thị Bảo", "position": "TLKD", "region": "Bình Dương"},
    {"id": 56, "name": "Ung Văn Phúc", "position": "TLKD", "region": "Hà Nội"},
    {"id": 72, "name": "Sơn Văn Khoa", "position": "TLKD", "region": "HCM"},
    
    # Giám sát
    {"id": 104, "name": "Test 1 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 105, "name": "Test 2 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 106, "name": "Test 3 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 107, "name": "Test 4 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 108, "name": "Test 5 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 109, "name": "Test 6 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 110, "name": "Test 7 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 111, "name": "Test 8 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 112, "name": "Test 9 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 113, "name": "Test 10 Giám sát", "position": "Giám sát", "region": "Bình Dương"},
    {"id": 184, "name": "Test 81 Giám sát", "position": "Giám sát", "region": "Hà Nội"},
    {"id": 264, "name": "Test 161 Giám sát", "position": "Giám sát", "region": "HCM"},
]

def get_kpi_templates(position_id):
    """Get KPI templates for a position"""
    response = requests.get(f"{BASE_URL}/api/kpi-templates/{position_id}?type=kpi")
    if response.status_code == 200:
        return response.json().get('templates', [])
    return []

def create_kpi_data(user_id, year, month, templates):
    """Create KPI data with random values"""
    kpi_data = []
    
    for template in templates[:6]:  # Only first 6 KPI
        # Generate realistic values based on standard
        standard = template['standard_value']
        
        # Random performance: 60% to 140% of standard
        performance_factor = random.uniform(0.6, 1.4)
        actual_value = round(standard * performance_factor, 2)
        
        kpi_data.append({
            'templateId': template['id'],
            'actualValue': actual_value
        })
    
    payload = {
        'userId': user_id,
        'year': year,
        'month': month,
        'kpiData': kpi_data
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/kpi-data", json=payload)
        if response.status_code == 200:
            return True
        else:
            print(f"  ❌ Failed for user {user_id}: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"  ❌ Error for user {user_id}: {e}")
        return False

def main():
    print("🚀 Creating sample KPI data for Dashboard testing...")
    print()
    
    year = 2025
    month = 12
    
    success_count = 0
    
    for user in sample_users:
        print(f"📝 Creating KPI for {user['name']} ({user['position']})...", end=' ')
        
        # Map position to position_id
        position_map = {
            'PTGĐ': 1,
            'GĐKD': 2,
            'TLKD': 3,
            'Giám sát': 4
        }
        
        position_id = position_map[user['position']]
        
        # Get templates
        templates = get_kpi_templates(position_id)
        
        if not templates:
            print(f"❌ No templates found for position {position_id}")
            continue
        
        # Create KPI data
        if create_kpi_data(user['id'], year, month, templates):
            print("✅")
            success_count += 1
        
    print()
    print("=" * 80)
    print(f"✅ COMPLETED! Created KPI data for {success_count}/{len(sample_users)} users")
    print(f"📅 Month: {month}/{year}")
    print()
    print("🔍 Now you can test Dashboard with:")
    print(f"   - Admin: admin / admin123 (see all 4 regions)")
    print(f"   - PTGĐ: ptgd_binhduong / 123456 (see Bình Dương region)")
    print(f"   - GĐKD: gdkd_bd_01 / 123456 (see subordinates)")
    print(f"   - TLKD: tlkd_bd_01_01 / 123456 (see 5 supervisors)")
    print(f"   - Giám sát: gs_bd_01_01_01 / 123456 (see all supervisors)")
    print("=" * 80)

if __name__ == '__main__':
    main()
