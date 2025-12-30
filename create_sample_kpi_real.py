#!/usr/bin/env python3
"""
Create sample KPI data for 30 real users (December 2025)
Mix of different regions and performance levels
"""

import requests
import random
import time

API_BASE = "http://localhost:3000"

def get_real_users(limit=30):
    """Get random sample of real users"""
    # Get users from database via API
    # For now, we'll use user IDs: 424-453 (first 30 users from each region)
    users = []
    
    # BD: 424-438 (15 users)
    for uid in range(424, 439):
        users.append(uid)
    
    # HCM: 487-496 (10 users)  
    for uid in range(487, 497):
        users.append(uid)
    
    # HN: 522-526 (5 users)
    for uid in range(522, 527):
        users.append(uid)
    
    return users[:30]

def get_kpi_templates():
    """Get KPI templates for Giám sát (position_id=4)"""
    try:
        response = requests.get(f"{API_BASE}/api/kpi-templates/4", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('templates', [])
        else:
            print(f"❌ Failed to get templates: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting templates: {e}")
        return []

def create_kpi_data(user_id, year, month, templates):
    """Create KPI data for a user"""
    kpi_data = []
    
    # Generate random performance (60%-140% of standard)
    performance_multiplier = random.uniform(0.6, 1.4)
    
    for template in templates:
        if template['is_for_kpi'] == 1:  # KPI templates only
            # Calculate actual value based on standard and random performance
            actual_value = int(template['standard_value'] * performance_multiplier)
            kpi_data.append({
                "templateId": template['id'],
                "actualValue": actual_value
            })
    
    payload = {
        "userId": user_id,
        "year": year,
        "month": month,
        "kpiData": kpi_data
    }
    
    try:
        response = requests.post(f"{API_BASE}/api/kpi-data", json=payload, timeout=10)
        if response.status_code == 200:
            return True
        else:
            print(f"❌ Failed for user {user_id}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error for user {user_id}: {e}")
        return False

def main():
    print("🚀 Creating sample KPI data for 30 real users...")
    print(f"📅 Month: December 2025\n")
    
    # Get KPI templates
    templates = get_kpi_templates()
    if not templates:
        print("❌ Failed to get KPI templates")
        return
    
    kpi_templates = [t for t in templates if t['is_for_kpi'] == 1]
    print(f"📋 Found {len(kpi_templates)} KPI templates\n")
    
    # Get user IDs
    user_ids = get_real_users()
    print(f"👥 Creating data for {len(user_ids)} users\n")
    
    success_count = 0
    year = 2025
    month = 12
    
    for idx, user_id in enumerate(user_ids, start=1):
        print(f"[{idx}/{len(user_ids)}] User ID {user_id}...", end=" ")
        
        if create_kpi_data(user_id, year, month, kpi_templates):
            print("✅")
            success_count += 1
        else:
            print("❌")
        
        time.sleep(0.1)
    
    print(f"\n" + "="*60)
    print(f"✅ Successfully created KPI data for {success_count}/{len(user_ids)} users")
    print(f"📅 Month: {month}/{year}")
    print("="*60)

if __name__ == "__main__":
    main()
