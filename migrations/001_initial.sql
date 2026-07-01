-- ============================================================
-- 热量计算器 D1 数据库初始化
-- 迁移 001: 用户、会话、饮食记录、自定义食物、设置、AI缓存
-- ============================================================

-- 用户表：存储注册用户信息
-- 密码哈希在客户端完成 (SHA-256 + salt)，服务端只存储哈希值
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,          -- userId, e.g. 'u_lx8fk3a2'
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 会话表：活跃登录会话
-- token 作为 Bearer token 发送给客户端
-- 30 天过期，过期后自动清理
CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,            -- UUID v4
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL                -- ISO 8601, 创建时 +30 天
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 饮食记录表：每行一条食物摄入记录
-- 按 (user_id, record_date) 查询，支持历史汇总
CREATE TABLE IF NOT EXISTS food_records (
    id            TEXT PRIMARY KEY,          -- 客户端生成的记录 ID
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date   TEXT NOT NULL,             -- 'YYYY-MM-DD'
    food_id       TEXT NOT NULL,             -- 食物 ID: 's01' / 'custom_xxx' / 'ai_xxx'
    food_name     TEXT NOT NULL,
    category      TEXT NOT NULL DEFAULT '',
    grams         REAL NOT NULL DEFAULT 0,
    serving_label TEXT NOT NULL DEFAULT '',
    calories      REAL NOT NULL DEFAULT 0,
    carbs         REAL NOT NULL DEFAULT 0,
    protein       REAL NOT NULL DEFAULT 0,
    fat           REAL NOT NULL DEFAULT 0,
    time          TEXT NOT NULL DEFAULT '',  -- 显示时间 '12:30'
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_records_user_date ON food_records(user_id, record_date);

-- 自定义食物表：用户自定义的食物定义
CREATE TABLE IF NOT EXISTS custom_foods (
    id          TEXT PRIMARY KEY,            -- 'custom_xxx'
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'custom',
    cal         REAL NOT NULL DEFAULT 0,
    carbs       REAL NOT NULL DEFAULT 0,
    protein     REAL NOT NULL DEFAULT 0,
    fat         REAL NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON custom_foods(user_id);

-- 用户设置表：每个用户一行，JSON 存储完整设置
CREATE TABLE IF NOT EXISTS user_settings (
    user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings_json TEXT NOT NULL DEFAULT '{}',
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI 缓存表：缓存 AI 生成的建议和食谱
CREATE TABLE IF NOT EXISTS ai_cache (
    id          TEXT PRIMARY KEY,            -- '{user_id}_{type}_{date}'
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_type  TEXT NOT NULL,               -- 'advice' 或 'mealplan'
    cache_date  TEXT NOT NULL,               -- 'YYYY-MM-DD'
    data_json   TEXT NOT NULL,               -- JSON 序列化的 AI 响应
    saved_at    INTEGER NOT NULL DEFAULT 0,  -- epoch ms
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cache_lookup
    ON ai_cache(user_id, cache_type, cache_date);
