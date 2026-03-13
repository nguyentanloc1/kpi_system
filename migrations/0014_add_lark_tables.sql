CREATE TABLE IF NOT EXISTS holiday_days
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    holiday_count INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (year, month)
    );

CREATE TABLE IF NOT EXISTS lark_video_cache
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    email TEXT NOT NULL,
    video_create_time TEXT NOT NULL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (channel, video_create_time)
    );

CREATE INDEX IF NOT EXISTS idx_lark_video_email_date
    ON lark_video_cache (email, video_create_time);

CREATE TABLE IF NOT EXISTS lark_sync_meta
(
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_synced_at DATETIME,
    last_row_count INTEGER DEFAULT 0,
    new_rows_added INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    triggered_by TEXT DEFAULT 'manual'
    );

INSERT OR IGNORE INTO lark_sync_meta (id)
VALUES (1);CREATE TABLE IF NOT EXISTS holiday_days
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    holiday_count INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (year, month)
    );

CREATE TABLE IF NOT EXISTS lark_video_cache
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    email TEXT NOT NULL,
    video_create_time TEXT NOT NULL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (channel, video_create_time)
    );

CREATE INDEX IF NOT EXISTS idx_lark_video_email_date
    ON lark_video_cache (email, video_create_time);

CREATE TABLE IF NOT EXISTS lark_sync_meta
(
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_synced_at DATETIME,
    last_row_count INTEGER DEFAULT 0,
    new_rows_added INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    triggered_by TEXT DEFAULT 'manual'
    );

INSERT OR IGNORE INTO lark_sync_meta (id)
VALUES (1);