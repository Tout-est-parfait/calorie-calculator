-- 为 food_records 表添加 meal 字段（早餐/午餐/晚餐/加餐）
ALTER TABLE food_records ADD COLUMN meal TEXT DEFAULT 'snacks';
