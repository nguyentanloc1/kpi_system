-- Seed Revenue Plan 2026 with seasonal variations
-- Pattern: Low in summer, high in Q1/Q4 (business season)
-- Delete existing 2026 data first
DELETE FROM revenue_plan WHERE year = 2026;
PRAGMA foreign_keys = OFF;
-- PTGĐ (position_id=1): Base 5 tỷ with variations
-- T1-T3: Cao (Tết, đầu năm) - 5.5, 6, 5.2
-- T4-T6: Trung bình - 4.8, 5, 5.3
-- T7-T9: Thấp (hè) - 4.5, 4.2, 4.6
-- T10-T12: Cao (cuối năm) - 5.8, 6.2, 6.5
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 1, 5.5 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 2, 6.0 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 3, 5.2 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 4, 4.8 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 5, 5.0 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 6, 5.3 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 7, 4.5 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 8, 4.2 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 9, 4.6 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 10, 5.8 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 11, 6.2 FROM users WHERE position_id = 1 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 12, 6.5 FROM users WHERE position_id = 1 AND username != 'admin';

-- GĐKD (position_id=2): Base 4 tỷ with variations
-- T1-T3: 4.2, 4.8, 4.0
-- T4-T6: 3.8, 4.0, 4.2
-- T7-T9: 3.5, 3.3, 3.7
-- T10-T12: 4.6, 5.0, 5.2
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 1, 4.2 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 2, 4.8 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 3, 4.0 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 4, 3.8 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 5, 4.0 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 6, 4.2 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 7, 3.5 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 8, 3.3 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 9, 3.7 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 10, 4.6 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 11, 5.0 FROM users WHERE position_id = 2 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 12, 5.2 FROM users WHERE position_id = 2 AND username != 'admin';

-- TLKD (position_id=3): Base 3 tỷ with variations
-- T1-T3: 3.2, 3.6, 3.0
-- T4-T6: 2.8, 3.0, 3.2
-- T7-T9: 2.5, 2.3, 2.7
-- T10-T12: 3.5, 3.8, 4.0
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 1, 3.2 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 2, 3.6 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 3, 3.0 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 4, 2.8 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 5, 3.0 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 6, 3.2 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 7, 2.5 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 8, 2.3 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 9, 2.7 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 10, 3.5 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 11, 3.8 FROM users WHERE position_id = 3 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 12, 4.0 FROM users WHERE position_id = 3 AND username != 'admin';

-- GĐKDCC (position_id=5): Base 4.5 tỷ with variations
-- T1-T3: 4.8, 5.2, 4.5
-- T4-T6: 4.2, 4.5, 4.8
-- T7-T9: 4.0, 3.8, 4.2
-- T10-T12: 5.0, 5.5, 5.8
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 1, 4.8 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 2, 5.2 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 3, 4.5 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 4, 4.2 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 5, 4.5 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 6, 4.8 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 7, 4.0 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 8, 3.8 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 9, 4.2 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 10, 5.0 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 11, 5.5 FROM users WHERE position_id = 5 AND username != 'admin';
INSERT INTO revenue_plan (user_id, year, month, planned_revenue)
SELECT id, 2026, 12, 5.8 FROM users WHERE position_id = 5 AND username != 'admin';
PRAGMA foreign_keys = ON;
