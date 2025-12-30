#!/usr/bin/env python3
"""
Populate real users from Excel data
- Username = email (khoi field)
- Password = 123456
- Full name = vi_tri field  
- Region = ngay_nhan_viec field (BD=1, HN=2, MT=3, HCM=4)
- Position = Giám sát (position_id=4)
- Manager = null for now
"""

import requests
import json
import time

API_BASE = "http://localhost:3000"

# Region mapping
REGION_MAP = {
    "BD": 1,    # Bình Dương
    "HN": 2,    # Hà Nội
    "MT": 3,    # Miền Trung
    "HCM": 4    # Hồ Chí Minh
}

# Read JSON data (already parsed)
users_data = [
  {
    "ho_ten": "NGUYỄN QUỐC TRUNG",
    "email": "trungnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "TRẦN MINH CHÂU",
    "email": "chautm",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "ĐẶNG GIA KHÁNH",
    "email": "khanhdang",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "ĐỖ MINH NGÂN",
    "email": "ngando",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGÔ THỊ DIỄM SƯƠNG",
    "email": "suongngo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN XUÂN THẮNG",
    "email": "thangnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN VĂN QUANG",
    "email": "quangnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "ĐẶNG THỊ ÁNH LÂM",
    "email": "lamdang",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ THÙY LIÊN",
    "email": "lienntt",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN ĐÌNH HIỆU",
    "email": "hieunguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ HUY THIỆN",
    "email": "thienle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ YẾN NHI",
    "email": "nhinguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "VÕ THỊ MỸ TIÊN",
    "email": "tienvo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "QUÁCH TƯỜNG",
    "email": "tuongquach",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN HIẾU NHÂN",
    "email": "nhannh",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN HỮU NHẬT MINH",
    "email": "minhnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "CAO TÀI NHÂN",
    "email": "nhanct",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ NGỌC MAI",
    "email": "mainguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN NGỌC ÁNH",
    "email": "anhnn",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN ĐÌNH DUY",
    "email": "duynd",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ THANH SANG",
    "email": "sangle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "VŨ MINH HÙNG",
    "email": "hungvu",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "HOÀNG THỤY TRÚC LINH",
    "email": "linhhtt",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "TRẦN THỊ HIỀN",
    "email": "hientt",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN NHẬT HÀO",
    "email": "haonn",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "TRẦN MINH THƯƠNG",
    "email": "thuongtran",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ VI",
    "email": "vile",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "HUỲNH THỊ CÚC HOA",
    "email": "hoahuynh",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHẠM HUY SƠN",
    "email": "sonph",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHẠM THỊ NGỌC MƠ",
    "email": "mopham",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ THỊ NGỌC PHƯỢNG",
    "email": "Phuongle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ KHỎE NHU",
    "email": "nhuntk",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "VÕ NGUYỄN HUỲNH NHI",
    "email": "nhivo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ THỊ MỸ HẬU",
    "email": "haule",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHAN TRỌNG PHÚ",
    "email": "phuphan",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "VÕ THỊ MAI THANH",
    "email": "thanhvo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "ĐỖ KIM OANH",
    "email": "oanhdo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGÔ TUẤN NGUYÊN",
    "email": "nguyenngo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHẠM VIỆT TRINH",
    "email": "trinhpham",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN VĂN SANG",
    "email": "sangnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "BÙI THỊ THANH XUÂN",
    "email": "xuanbui",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THÀNH DUY",
    "email": "duynguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ THỊ SEN",
    "email": "senle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "THÁI ANH TRANG",
    "email": "trangthai",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ KHẢI DUNG",
    "email": "dungntk",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN TRẦN PHƯƠNG LAM",
    "email": "lamntp",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN QUỲNH ĐỨC",
    "email": "ducnq",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "VÕ THỊ TỐ UYÊN",
    "email": "uyenvo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "MAI THỊ VÂN HẬU",
    "email": "haumai",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "TRẦN THỊ LAN UYÊN",
    "email": "uyentran",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ BÍCH THỦY",
    "email": "Thuyle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHẠM TRỌNG PHÚC",
    "email": "phucpham",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THỊ VÂN ANH",
    "email": "anhntv",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN TRƯỜNG TỒN",
    "email": "tonnguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "PHẠM MINH TRỌNG",
    "email": "trongpham",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN MAI THỦY TRÂM",
    "email": "tramnmt",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ THỊ ÁNH NGỌC",
    "email": "ngocle",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "TRẦN TRUNG TÍN",
    "email": "tintran",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN THÚY ĐIỀU",
    "email": "dieunguyen",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGUYỄN TẤN CƯƠNG",
    "email": "cuongnguyentv",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "NGÔ THỊ THANH NGÂN",
    "email": "nganngo",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "LÊ VĂN BẮC",
    "email": "levanbac",
    "bo_phan": "BD"
  },
  {
    "ho_ten": "HÀ THỊ LOAN",
    "email": "loanha",
    "bo_phan": "BD"
  },
  # HCM region
  {
    "ho_ten": "VŨ QUANG HOAN",
    "email": "hoanvu",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN ĐỨC CẦN",
    "email": "cannguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN THỊ KIM CƯƠNG",
    "email": "cuongnguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "HÀ VĂN QUANG",
    "email": "quangha",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "VÕ THỊ KIỀU TRANG",
    "email": "trangvo",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "CAO HỮU NHÂN",
    "email": "nhancao",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "BÙI DUY DANL",
    "email": "danlbui",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "TRIỆU ĐỨC VINH",
    "email": "vinhtrieu",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "LÂM VĂN KHANH",
    "email": "khanhlam",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN KIM HOÀN",
    "email": "hoannguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN THỊ HẠNH NGUYÊN",
    "email": "nguyennguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "PHẠM MINH THÙY",
    "email": "thuypham",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "TRẦN CHIẾN THẮNG",
    "email": "thangtran",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN THANH BÌNH",
    "email": "binhnguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN THỊ THANH TRANG",
    "email": "trangntt",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN KIM ĐÀO",
    "email": "daonk",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGÔ THỊ MINH CHÂU",
    "email": "chaungo",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN MINH HIẾU",
    "email": "hieunm",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "LA PHÁP THĂNG",
    "email": "thangla",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "TRẦN THỊ QUYÊN",
    "email": "quyentran",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "LƯU THANH PHỤNG",
    "email": "phungluu",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "PHAN THỊ THÙY LINH",
    "email": "linhphan",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "TẠ THỊ HẠNH NGUYÊN",
    "email": "nguyenta",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "HOÀNG PHÚC TẤN",
    "email": "tanhoang",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "HỒ TẤN KIỆT",
    "email": "kietho",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "LA TÔN ÁI NHƯ",
    "email": "nhula",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN MINH QUÂN",
    "email": "quannguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "VI LƯƠNG MINH HIỀN",
    "email": "hienvi",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "PHẠM THỊ HOÀI THƯƠNG",
    "email": "thuongpham",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN VĂN HOAN",
    "email": "hoannv",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN BẢO CHUNG",
    "email": "chungnguyen",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "BÀNH NGỌC NHƯ Ý",
    "email": "ybanh",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "NGUYỄN KHÁNH DUY",
    "email": "duynk",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "ĐỖ NGỌC CHÂU PHA",
    "email": "phado",
    "bo_phan": "HCM"
  },
  {
    "ho_ten": "VƯƠNG XUÂN TRÚC",
    "email": "trucvuong",
    "bo_phan": "HCM"
  },
  # HN region
  {
    "ho_ten": "ĐỖ ĐỨC CHÍ",
    "email": "chido",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "TRẦN THỊ THỦY",
    "email": "thuytran",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "CAO THỊ PHƯỢNG",
    "email": "phuongcao",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "NGUYỄN THỊ HẬU",
    "email": "haunguyen",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "PHẠM ĐỨC ANH",
    "email": "anhpd",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "VŨ THU HẰNG",
    "email": "hangvu",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "LÊ THỊ CHÂM",
    "email": "chamle",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "PHẠM THỊ TÂM",
    "email": "tampham",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "MAI QUANG ANH",
    "email": "anhmai",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "BÙI THANH HIỀN",
    "email": "hienbui",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "PHAN THỊ HƯƠNG",
    "email": "huongphan",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "NGÔ THỊ LỢI",
    "email": "loingo",
    "bo_phan": "HN"
  },
  {
    "ho_ten": "NGUYỄN MAI ANH",
    "email": "anhnm",
    "bo_phan": "HN"
  },
  # MT region
  {
    "ho_ten": "LÊ THỊ BÍCH HẠNH",
    "email": "hanhle",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "PHẠM THỊ OANH",
    "email": "oanhpt",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "TRỊNH THỊ KHÁNH LY",
    "email": "lytrinh",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "PHAN VĂN HIẾU",
    "email": "hieuphan",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "A RÉT ANH TÀI",
    "email": "taia",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "NGUYỄN THỊ THU NGUYỆT",
    "email": "nguyetnguyen",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "ĐOÀN THỊ TRÂM OANH",
    "email": "oanhdoan",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "ĐỖ VÕ HIỀN LINH",
    "email": "linhdo",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "ĐẶNG THỊ KIM MỴ",
    "email": "mydang",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "LÊ THỊ THU HÀ",
    "email": "hale",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "THÁI THỊ HÒA HẢO",
    "email": "haothai",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "NGUYỄN HOÀNG ANH QUANG",
    "email": "quangnha",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "TRẦN THỊ PHƯƠNG NGUYÊN",
    "email": "nguyentran",
    "bo_phan": "MT"
  },
  {
    "ho_ten": "LÊ THỊ TRANG",
    "email": "trangle",
    "bo_phan": "MT"
  }
]

def create_user(username, password, full_name, region_id, position_id, manager_id=None, start_date="2020-01-01"):
    """Create a user via API"""
    url = f"{API_BASE}/api/admin/users"
    payload = {
        "username": username,
        "password": password,
        "fullName": full_name,
        "regionId": region_id,
        "positionId": position_id,
        "managerId": manager_id,
        "startDate": start_date
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('userId')
        else:
            print(f"❌ Failed to create {username}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating {username}: {e}")
        return None

def main():
    print("🚀 Starting user population...")
    print(f"📊 Total users to create: {len(users_data)}")
    
    created_count = 0
    failed_count = 0
    
    for idx, user_data in enumerate(users_data, start=1):
        username = user_data['email']
        full_name = user_data['ho_ten']
        bo_phan = user_data['bo_phan']
        region_id = REGION_MAP.get(bo_phan, 1)
        
        # All are Giám sát (position_id = 4)
        position_id = 4
        
        print(f"\n[{idx}/{len(users_data)}] Creating {username}...")
        print(f"  Name: {full_name}")
        print(f"  Region: {bo_phan} (ID: {region_id})")
        
        user_id = create_user(
            username=username,
            password="123456",
            full_name=full_name,
            region_id=region_id,
            position_id=position_id,
            manager_id=None,
            start_date="2020-01-01"
        )
        
        if user_id:
            print(f"  ✅ Created with ID: {user_id}")
            created_count += 1
        else:
            print(f"  ❌ Failed")
            failed_count += 1
        
        time.sleep(0.1)  # Rate limiting
    
    print(f"\n" + "="*60)
    print(f"✅ Successfully created: {created_count} users")
    print(f"❌ Failed: {failed_count} users")
    print(f"📊 Total: {len(users_data)} users")
    print("="*60)

if __name__ == "__main__":
    main()
