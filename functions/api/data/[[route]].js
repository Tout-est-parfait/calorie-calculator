/**
 * 热量计算器 — 数据 CRUD API
 * 捕获 /api/data/* 所有路径
 *
 * 路由表：
 *   GET    /api/data/records?date=YYYY-MM-DD  获取某日饮食记录
 *   POST   /api/data/records                   添加一条饮食记录
 *   DELETE /api/data/records                   删除一条饮食记录
 *   GET    /api/data/records/summaries         历史记录汇总（7天统计）
 *   GET    /api/data/custom-foods              获取用户自定义食物
 *   POST   /api/data/custom-foods              添加自定义食物
 *   DELETE /api/data/custom-foods              删除自定义食物
 *   GET    /api/data/settings                   获取用户设置
 *   PUT    /api/data/settings                   保存用户设置
 *   GET    /api/data/ai-cache?type=&date=       获取 AI 缓存
 *   POST   /api/data/ai-cache                   保存 AI 缓存
 *   POST   /api/data/sync                       全量上传（迁移用）
 *   GET    /api/data/sync                       全量下载（同步用）
 *
 * 鉴权：Bearer token（匿名用户直接返回空数据）
 * D1 绑定：context.env.DB
 */

'use strict';

import {
  jsonResponse, errorResponse, handleOptions, validateSession
} from '../../_shared/auth.js';

// ═══════════════════════════════════════════════════
// 入口
// ═══════════════════════════════════════════════════

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  // 提取 /api/data/ 后面的路径部分
  const path = url.pathname.replace('/api/data/', '').replace(/\/$/, '') || '';

  // 鉴权：提取用户信息（匿名则为 null）
  const session = await validateSession(db, request);

  try {
    return await routeRequest(db, session, path, request.method.toUpperCase(), request, url);
  } catch (e) {
    console.error('Data API error:', path, e);
    return errorResponse('Internal server error: ' + e.message, 500);
  }
}

// ═══════════════════════════════════════════════════
// 路由分发
// ═══════════════════════════════════════════════════

async function routeRequest(db, session, path, method, request, url) {
  // ─── 需要登录的路由 ───
  if (!session) {
    // 未登录时，GET 请求返回空数据，写操作返回 401
    if (method === 'GET') {
      return handleAnonymousGet(path, url);
    }
    return errorResponse('请先登录', 401);
  }

  const userId = session.userId;

  // ── 饮食记录 ──
  if (path === 'records' || path.startsWith('records/')) {
    // records/summaries
    if (path === 'records/summaries' && method === 'GET') {
      return await getRecordSummaries(db, userId);
    }
    // records (自身)
    if (path === 'records') {
      if (method === 'GET') {
        const date = url.searchParams.get('date') || '';
        return await getRecords(db, userId, date);
      }
      if (method === 'POST') {
        const body = await request.json();
        return await addRecord(db, userId, body);
      }
      if (method === 'DELETE') {
        const body = await request.json();
        return await deleteRecord(db, userId, body);
      }
    }
    return errorResponse('Method not allowed', 405);
  }

  // ── 自定义食物 ──
  if (path === 'custom-foods') {
    if (method === 'GET')  return await getCustomFoods(db, userId);
    if (method === 'POST') {
      const body = await request.json();
      return await addCustomFood(db, userId, body);
    }
    if (method === 'DELETE') {
      const body = await request.json();
      return await deleteCustomFood(db, userId, body);
    }
    return errorResponse('Method not allowed', 405);
  }

  // ── 用户设置 ──
  if (path === 'settings') {
    if (method === 'GET') return await getSettings(db, userId);
    if (method === 'PUT') {
      const body = await request.json();
      return await saveSettings(db, userId, body);
    }
    return errorResponse('Method not allowed', 405);
  }

  // ── AI 缓存 ──
  if (path === 'ai-cache') {
    if (method === 'GET') {
      const type = url.searchParams.get('type') || '';
      const date = url.searchParams.get('date') || '';
      return await getAICache(db, userId, type, date);
    }
    if (method === 'POST') {
      const body = await request.json();
      return await saveAICache(db, userId, body);
    }
    return errorResponse('Method not allowed', 405);
  }

  // ── 全量同步 ──
  if (path === 'sync') {
    if (method === 'POST') {
      const body = await request.json();
      return await syncUpload(db, userId, body);
    }
    if (method === 'GET') {
      return await syncDownload(db, userId);
    }
    return errorResponse('Method not allowed', 405);
  }

  return errorResponse('Unknown route: ' + path, 404);
}

// ═══════════════════════════════════════════════════
// 匿名用户 GET 请求返回空数据
// ═══════════════════════════════════════════════════

function handleAnonymousGet(path, url) {
  if (path === 'records' || path === 'records/summaries') return jsonResponse({ records: [] });
  if (path === 'custom-foods') return jsonResponse({ foods: [] });
  if (path === 'settings') return jsonResponse({ settings: null });
  if (path === 'ai-cache') return jsonResponse({ data: null });
  if (path === 'sync') return jsonResponse({ data: null });
  return jsonResponse({});
}

// ═══════════════════════════════════════════════════
// 饮食记录
// ═══════════════════════════════════════════════════

async function getRecords(db, userId, date) {
  if (!date) return errorResponse('缺少 date 参数', 400);

  const result = await db.prepare(
    'SELECT * FROM food_records WHERE user_id = ? AND record_date = ? ORDER BY created_at ASC'
  ).bind(userId, date).all();

  return jsonResponse({ records: result.results || [] });
}

async function addRecord(db, userId, body) {
  const { date, record } = body;
  if (!date || !record) {
    return errorResponse('缺少 date 或 record 参数', 400);
  }

  await db.prepare(
    `INSERT INTO food_records
     (id, user_id, record_date, food_id, food_name, category, grams, serving_label,
      calories, carbs, protein, fat, time, meal, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    record.id, userId, date,
    record.foodId || '', record.foodName || '', record.category || '',
    record.grams || 0, record.servingLabel || '',
    record.calories || 0, record.carbs || 0, record.protein || 0, record.fat || 0,
    record.time || '', record.meal || 'snacks', record.created_at || new Date().toISOString()
  ).run();

  return jsonResponse({ success: true, id: record.id });
}

async function deleteRecord(db, userId, body) {
  const { date, recordId } = body;
  if (!recordId) return errorResponse('缺少 recordId 参数', 400);

  await db.prepare(
    'DELETE FROM food_records WHERE id = ? AND user_id = ?'
  ).bind(recordId, userId).run();

  return jsonResponse({ success: true });
}

async function getRecordSummaries(db, userId) {
  const result = await db.prepare(
    `SELECT record_date,
            COUNT(*) as count,
            SUM(calories) as total_cal,
            SUM(carbs) as total_carbs,
            SUM(protein) as total_protein,
            SUM(fat) as total_fat
     FROM food_records
     WHERE user_id = ?
     GROUP BY record_date
     ORDER BY record_date DESC`
  ).bind(userId).all();

  return jsonResponse({ summaries: result.results || [] });
}

// ═══════════════════════════════════════════════════
// 自定义食物
// ═══════════════════════════════════════════════════

async function getCustomFoods(db, userId) {
  const result = await db.prepare(
    'SELECT * FROM custom_foods WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  // 转换成前端需要的格式（含 servings 数组）
  const foods = (result.results || []).map(f => ({
    id: f.id,
    name: f.name,
    category: f.category,
    cal: f.cal,
    carbs: f.carbs,
    protein: f.protein,
    fat: f.fat,
    servings: [
      { label: '100g', g: 100 },
      { label: '50g', g: 50 },
      { label: '200g', g: 200 },
    ],
  }));

  return jsonResponse({ foods });
}

async function addCustomFood(db, userId, body) {
  const { id, name, cal, carbs, protein, fat } = body;
  if (!id || !name) return errorResponse('缺少 id 或 name', 400);

  await db.prepare(
    `INSERT INTO custom_foods (id, user_id, name, category, cal, carbs, protein, fat)
     VALUES (?, ?, ?, 'custom', ?, ?, ?, ?)`
  ).bind(id, name, cal || 0, carbs || 0, protein || 0, fat || 0).run();

  return jsonResponse({ success: true, id });
}

async function deleteCustomFood(db, userId, body) {
  const { id } = body;
  if (!id) return errorResponse('缺少 id', 400);

  await db.prepare(
    'DELETE FROM custom_foods WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();

  return jsonResponse({ success: true });
}

// ═══════════════════════════════════════════════════
// 用户设置
// ═══════════════════════════════════════════════════

async function getSettings(db, userId) {
  const row = await db.prepare(
    'SELECT settings_json, updated_at FROM user_settings WHERE user_id = ?'
  ).bind(userId).first();

  if (!row) return jsonResponse({ settings: null });

  let settings;
  try {
    settings = JSON.parse(row.settings_json);
  } catch (e) {
    settings = null;
  }

  return jsonResponse({ settings, updatedAt: row.updated_at });
}

async function saveSettings(db, userId, body) {
  const settingsJson = JSON.stringify(body);

  await db.prepare(
    `INSERT INTO user_settings (user_id, settings_json, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json, updated_at = datetime('now')`
  ).bind(userId, settingsJson).run();

  return jsonResponse({ success: true });
}

// ═══════════════════════════════════════════════════
// AI 缓存
// ═══════════════════════════════════════════════════

async function getAICache(db, userId, cacheType, cacheDate) {
  if (!cacheType || !cacheDate) return errorResponse('缺少 type 或 date 参数', 400);

  const row = await db.prepare(
    'SELECT data_json, saved_at FROM ai_cache WHERE user_id = ? AND cache_type = ? AND cache_date = ?'
  ).bind(userId, cacheType, cacheDate).first();

  if (!row) return jsonResponse({ data: null });

  let data;
  try {
    data = JSON.parse(row.data_json);
  } catch (e) {
    data = null;
  }

  return jsonResponse({ data, savedAt: row.saved_at });
}

async function saveAICache(db, userId, body) {
  const { type, date, data } = body;
  if (!type || !date || !data) return errorResponse('缺少 type, date 或 data 参数', 400);

  const id = `${userId}_${type}_${date}`;
  const dataJson = JSON.stringify(data);
  const savedAt = Date.now();

  await db.prepare(
    `INSERT INTO ai_cache (id, user_id, cache_type, cache_date, data_json, saved_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, saved_at = excluded.saved_at`
  ).bind(id, userId, type, date, dataJson, savedAt).run();

  return jsonResponse({ success: true });
}

// ═══════════════════════════════════════════════════
// 全量同步（迁移 + 日常同步）
// ═══════════════════════════════════════════════════

/** 客户端上传所有本地数据到 D1 */
async function syncUpload(db, userId, body) {
  const results = { records: 0, customFoods: 0, settings: false, aiCache: 0 };

  // 批量导入饮食记录
  if (body.records && typeof body.records === 'object') {
    for (const [date, records] of Object.entries(body.records)) {
      if (!Array.isArray(records)) continue;
      for (const r of records) {
        try {
          await db.prepare(
            `INSERT OR REPLACE INTO food_records
             (id, user_id, record_date, food_id, food_name, category, grams, serving_label,
              calories, carbs, protein, fat, time, meal, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            r.id, userId, date,
            r.foodId || '', r.foodName || '', r.category || '',
            r.grams || 0, r.servingLabel || '',
            r.calories || 0, r.carbs || 0, r.protein || 0, r.fat || 0,
            r.time || '', r.meal || 'snacks', r.created_at || new Date().toISOString()
          ).run();
          results.records++;
        } catch (e) {
          // 跳过重复记录（id 冲突）
          console.warn('Sync upload record skip:', e.message);
        }
      }
    }
  }

  // 批量导入自定义食物
  if (Array.isArray(body.customFoods)) {
    for (const f of body.customFoods) {
      try {
        await db.prepare(
          `INSERT OR REPLACE INTO custom_foods (id, user_id, name, category, cal, carbs, protein, fat)
           VALUES (?, ?, ?, 'custom', ?, ?, ?, ?)`
        ).bind(f.id, userId, f.name, f.cal || 0, f.carbs || 0, f.protein || 0, f.fat || 0).run();
        results.customFoods++;
      } catch (e) {
        console.warn('Sync upload custom food skip:', e.message);
      }
    }
  }

  // 导入设置
  if (body.settings && typeof body.settings === 'object') {
    try {
      const settingsJson = JSON.stringify(body.settings);
      await db.prepare(
        `INSERT OR REPLACE INTO user_settings (user_id, settings_json, updated_at)
         VALUES (?, ?, datetime('now'))`
      ).bind(userId, settingsJson).run();
      results.settings = true;
    } catch (e) {
      console.warn('Sync upload settings skip:', e.message);
    }
  }

  // 批量导入 AI 缓存
  if (Array.isArray(body.aiCache)) {
    for (const c of body.aiCache) {
      try {
        const id = `${userId}_${c.type}_${c.date}`;
        await db.prepare(
          `INSERT OR REPLACE INTO ai_cache (id, user_id, cache_type, cache_date, data_json, saved_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, userId, c.type, c.date, JSON.stringify(c.data), c.savedAt || Date.now()).run();
        results.aiCache++;
      } catch (e) {
        console.warn('Sync upload AI cache skip:', e.message);
      }
    }
  }

  return jsonResponse({ success: true, migrated: results });
}

/** 客户端从 D1 下载所有数据 */
async function syncDownload(db, userId) {
  // 饮食记录
  const recordsResult = await db.prepare(
    'SELECT * FROM food_records WHERE user_id = ? ORDER BY record_date DESC, created_at ASC'
  ).bind(userId).all();

  // 按日期分组
  const records = {};
  for (const r of (recordsResult.results || [])) {
    if (!records[r.record_date]) records[r.record_date] = [];
    records[r.record_date].push(r);
  }

  // 自定义食物
  const customFoodsResult = await db.prepare(
    'SELECT * FROM custom_foods WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  // 设置
  const settingsRow = await db.prepare(
    'SELECT settings_json FROM user_settings WHERE user_id = ?'
  ).bind(userId).first();

  let settings = null;
  if (settingsRow) {
    try { settings = JSON.parse(settingsRow.settings_json); } catch (e) { /* */ }
  }

  // AI 缓存
  const aiCacheResult = await db.prepare(
    'SELECT cache_type, cache_date, data_json, saved_at FROM ai_cache WHERE user_id = ?'
  ).bind(userId).all();

  const aiCache = (aiCacheResult.results || []).map(r => ({
    type: r.cache_type,
    date: r.cache_date,
    data: (() => { try { return JSON.parse(r.data_json); } catch (e) { return null; } })(),
    savedAt: r.saved_at,
  }));

  return jsonResponse({
    records,
    customFoods: customFoodsResult.results || [],
    settings,
    aiCache,
  });
}
