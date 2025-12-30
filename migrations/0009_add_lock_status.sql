-- Add locked status to kpi_data table
-- 0: unlocked (editable), 1: locked (read-only, needs admin unlock)
ALTER TABLE kpi_data ADD COLUMN is_locked INTEGER DEFAULT 0;

-- Add locked status to monthly_summary table
-- When user submits data, we can lock the entire month
ALTER TABLE monthly_summary ADD COLUMN is_locked INTEGER DEFAULT 0;

-- Add unlock_request status
-- 0: no request, 1: unlock requested, 2: approved (temporarily unlocked)
ALTER TABLE monthly_summary ADD COLUMN unlock_request_status INTEGER DEFAULT 0;
ALTER TABLE monthly_summary ADD COLUMN unlock_requested_at DATETIME;
ALTER TABLE monthly_summary ADD COLUMN unlock_approved_at DATETIME;
ALTER TABLE monthly_summary ADD COLUMN unlock_approved_by INTEGER;

-- Create index for lock status queries
CREATE INDEX IF NOT EXISTS idx_kpi_data_lock ON kpi_data(user_id, month, year, is_locked);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_lock ON monthly_summary(user_id, month, year, is_locked);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_unlock_request ON monthly_summary(unlock_request_status);
