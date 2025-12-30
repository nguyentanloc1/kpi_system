#!/bin/bash
# Insert users in batches to respect FK constraints

echo "===== Inserting 4 PTGĐ ====="
npx wrangler d1 execute webapp-production --local --command="
INSERT INTO users (username, password, full_name, region_id, position_id, start_date, manager_id) VALUES 
('ptgd_binhduong', '123456', 'Nguyễn Quốc Trung', 1, 1, '2020-01-15', NULL),
('ptgd_hanoi', '123456', 'Đỗ Đức Chí', 2, 1, '2020-01-15', NULL),
('ptgd_hochiminh', '123456', 'Vũ Quang Hoan', 4, 1, '2020-01-15', NULL),
('ptgd_mientrung', '123456', 'Lê Thị Bích Hạnh', 3, 1, '2020-01-15', NULL);
" 2>&1 | grep -E "Success|Error|✘" || echo "PTGĐ created"

echo "===== Inserting 16 GĐKD ====="
# Split into smaller batches - 4 at a time
for i in {21..24}; do
  grep "^INSERT.*VALUES.*gdkd_bd_" create_all_users_full.sql | head -4
done | npx wrangler d1 execute webapp-production --local 2>&1 | grep -E "Success|Error"

echo "Done! Check total users:"
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as total FROM users" 2>&1 | grep -A 5 "total"
