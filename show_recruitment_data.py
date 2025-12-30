#!/usr/bin/env python3
"""
Script hiển thị dữ liệu biểu đồ tuyển dụng cho Giám sát
"""
import requests
import json

def show_recruitment_data(year, month):
    url = f"http://localhost:3000/api/recruitment-chart/{year}/{month}"
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"❌ Lỗi API: {response.status_code}")
        return
    
    data = response.json()
    users = data['data']
    standard = data['standard']
    
    print(f"\n{'='*90}")
    print(f"📊 BIỂU ĐỒ TUYỂN DỤNG THÁNG {month}/{year}")
    print(f"Mức chuẩn: {standard} lao động/tháng")
    print(f"{'='*90}\n")
    
    # Thống kê
    above = [u for u in users if u.get('actual_value') and u['actual_value'] >= standard]
    below = [u for u in users if u.get('actual_value') and u['actual_value'] < standard]
    no_data = [u for u in users if not u.get('actual_value')]
    
    print(f"📈 TỔNG QUAN:")
    print(f"   • Tổng số Giám sát: {len(users)}")
    print(f"   • ✅ Trên chuẩn (≥{standard}): {len(above)} người")
    print(f"   • ❌ Dưới chuẩn (<{standard}): {len(below)} người")
    print(f"   • ⚪ Chưa có data: {len(no_data)} người\n")
    
    # Top 10
    print(f"{'='*90}")
    print('🏆 TOP 10 GIÁM SÁT TUYỂN DỤNG NHIỀU NHẤT:')
    print(f"{'='*90}")
    print(f"{'#':<4} {'Họ tên':<35} {'Khu vực':<15} {'Số lượng':>10} {'So với chuẩn':>15} {'Hoàn thành':>12}")
    print(f"{'-'*90}")
    
    sorted_users = sorted([u for u in users if u.get('actual_value')], 
                         key=lambda x: x['actual_value'], reverse=True)[:10]
    
    for i, u in enumerate(sorted_users, 1):
        diff = u['actual_value'] - standard
        icon = '🟢' if diff >= 0 else '🔴'
        comp = u.get('completion_percent', 0)
        print(f"{i:<4} {u['full_name']:<35} {u['region_name']:<15} {u['actual_value']:>10} {icon} {diff:>+13} {comp:>11.0f}%")
    
    # Bottom 10
    print(f"\n{'='*90}")
    print('⚠️  BOTTOM 10 GIÁM SÁT CẦN CẢI THIỆN:')
    print(f"{'='*90}")
    print(f"{'#':<4} {'Họ tên':<35} {'Khu vực':<15} {'Số lượng':>10} {'So với chuẩn':>15} {'Hoàn thành':>12}")
    print(f"{'-'*90}")
    
    bottom = sorted([u for u in users if u.get('actual_value')], 
                   key=lambda x: x['actual_value'])[:10]
    
    for i, u in enumerate(bottom, 1):
        diff = u['actual_value'] - standard
        comp = u.get('completion_percent', 0)
        print(f"{i:<4} {u['full_name']:<35} {u['region_name']:<15} {u['actual_value']:>10} 🔴 {diff:>+13} {comp:>11.0f}%")
    
    # Phân bố theo khu vực
    print(f"\n{'='*90}")
    print('📍 PHÂN BỐ THEO KHU VỰC:')
    print(f"{'='*90}")
    
    regions = {}
    for u in users:
        region = u['region_name']
        if region not in regions:
            regions[region] = {'total': 0, 'above': 0, 'below': 0, 'no_data': 0, 'sum': 0}
        
        regions[region]['total'] += 1
        
        if u.get('actual_value'):
            if u['actual_value'] >= standard:
                regions[region]['above'] += 1
            else:
                regions[region]['below'] += 1
            regions[region]['sum'] += u['actual_value']
        else:
            regions[region]['no_data'] += 1
    
    print(f"{'Khu vực':<20} {'Tổng':>8} {'Trên chuẩn':>12} {'Dưới chuẩn':>12} {'Chưa có data':>15} {'TB/người':>12}")
    print(f"{'-'*90}")
    
    for region, stats in sorted(regions.items()):
        avg = stats['sum'] / (stats['above'] + stats['below']) if (stats['above'] + stats['below']) > 0 else 0
        print(f"{region:<20} {stats['total']:>8} {stats['above']:>12} {stats['below']:>12} {stats['no_data']:>15} {avg:>11.1f}")
    
    print(f"\n{'='*90}")
    print(f"💡 HƯỚNG DẪN XEM BIỂU ĐỒ:")
    print(f"   1. Đăng nhập với tài khoản Giám sát (ví dụ: trungnguyen / 123456)")
    print(f"   2. Chọn tab 'Biểu đồ Tuyển dụng'")
    print(f"   3. Chọn tháng {month}/{year}")
    print(f"   4. Xem biểu đồ:")
    print(f"      • Cột màu XANH LÁ: Trên chuẩn (≥{standard} lao động)")
    print(f"      • Cột màu ĐỎ: Dưới chuẩn (<{standard} lao động)")
    print(f"      • Đường ngang ĐỎ: Mức chuẩn {standard} lao động")
    print(f"{'='*90}\n")

if __name__ == '__main__':
    show_recruitment_data(2025, 12)
