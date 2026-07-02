/**
 * 热量计算器 — AI API 集成模块
 * Phase 11-12: Kimi AI 集成（月之暗面 Moonshot）
 *
 * 功能：
 *   1. Kimi API 集成
 *   2. API Key 管理
 *   3. AI 食物估计 — 用户描述食物，AI 返回估计的营养数据
 *   4. AI 智能建议 — 发送当日摄入数据，获取个性化饮食与运动建议
 *   5. AI 每日食谱 — 根据用户目标生成全天饮食与训练计划
 *   6. 用户可自定义模型名称
 */

'use strict';

// ==================== 供应商配置 ====================

const AI_PROVIDER = {
  id: 'kimi',
  name: 'Kimi',
  endpoint: 'https://api.moonshot.cn/v1/chat/completions',
  defaultModel: 'moonshot-v1-8k',
  docsUrl: 'https://platform.moonshot.cn/console/api-keys',
};

const API_TIMEOUT = 15000; // 15 秒超时

// ==================== 代理模式配置 ====================
//
// 代理模式：前端请求同源路径（如 /api/kimi/chat/completions），
// 由 Nginx / Cloudflare Worker 转发到真正的 AI API。
// 密钥配置在代理端，不暴露给浏览器 —— 更安全，且绕过 CORS。
//
// 直接模式（默认）：前端直接请求 AI 供应商 API，需要用户在浏览器端配置 API Key。

const PROXY_MODE_KEY = 'cc_proxy_mode';

/**
 * 是否启用代理模式
 * @returns {boolean}
 */
function isProxyMode() {
  return localStorage.getItem(storageKey(PROXY_MODE_KEY)) === 'true';
}

/**
 * 设置代理模式开关
 * @param {boolean} enabled
 */
function setProxyMode(enabled) {
  if (enabled) {
    localStorage.setItem(storageKey(PROXY_MODE_KEY), 'true');
  } else {
    localStorage.removeItem(storageKey(PROXY_MODE_KEY));
  }
}

/**
 * 获取代理路径（同源相对路径）
 * @returns {string}
 */
function getProxyPath() {
  const key = 'cc_proxy_path';
  const saved = localStorage.getItem(storageKey(key));
  return (saved && saved.trim()) || '/api/kimi/chat/completions';
}

/**
 * 设置代理路径
 * @param {string} path
 */
function setProxyPath(path) {
  const key = 'cc_proxy_path';
  if (path && path.trim()) {
    localStorage.setItem(storageKey(key), path.trim());
  } else {
    localStorage.removeItem(storageKey(key));
  }
}

/**
 * 构建请求 URL：
 *   - 代理模式：返回同源相对路径（无 CORS 问题）
 *   - 直接模式：返回 API 外部地址
 * @returns {string}
 */
function buildRequestUrl() {
  if (isProxyMode()) {
    return getProxyPath();
  }
  return AI_PROVIDER.endpoint;
}

/**
 * 构建请求头：
 *   - 代理模式：不发送 Authorization（密钥在代理端）
 *   - 直接模式：发送 Bearer token
 * @param {string|null} apiKey
 * @returns {object}
 */
function buildRequestHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (!isProxyMode() && apiKey) {
    headers['Authorization'] = 'Bearer ' + apiKey;
  }
  return headers;
}

// ==================== API Key 管理 ====================

/**
 * 获取 API Key
 * 向后兼容：如果旧键 cc_apikey_deepseek 或 cc_apikey (Phase 11) 中有值，自动迁移
 * @returns {string|null}
 */
function getApiKey() {
  const key = 'cc_apikey_kimi';
  let val = localStorage.getItem(storageKey(key));

  // 向后兼容：Phase 11 旧键 → 自动迁移
  if (!val) {
    const oldKey = 'cc_apikey';
    const oldVal = localStorage.getItem(storageKey(oldKey));
    if (oldVal) {
      setApiKey(oldVal);
      localStorage.removeItem(storageKey(oldKey));
      return oldVal;
    }
  }

  // 向后兼容：DeepSeek 旧键 → 自动迁移
  if (!val) {
    const deepseekKey = 'cc_apikey_deepseek';
    const deepseekVal = localStorage.getItem(storageKey(deepseekKey));
    if (deepseekVal) {
      setApiKey(deepseekVal);
      localStorage.removeItem(storageKey(deepseekKey));
      return deepseekVal;
    }
  }

  return val || null;
}

/**
 * 保存 API Key
 * @param {string} key
 */
function setApiKey(key) {
  localStorage.setItem(storageKey('cc_apikey_kimi'), key.trim());
}

/**
 * 是否已配置 API Key
 * 代理模式下始终返回 true（密钥由代理端管理）
 * @returns {boolean}
 */
function hasApiKey() {
  if (isProxyMode()) return true;
  const key = getApiKey();
  return key && key.length > 0;
}

// ==================== 模型名称管理 ====================

/**
 * 获取自定义模型名称
 * @returns {string} 模型名称（有自定义则返回自定义，否则返回默认）
 */
function getApiModel() {
  const key = 'cc_apimodel_kimi';
  const saved = localStorage.getItem(storageKey(key));
  return (saved && saved.trim()) ? saved.trim() : AI_PROVIDER.defaultModel;
}

/**
 * 保存自定义模型名称
 * @param {string} model
 */
function setApiModel(model) {
  const key = 'cc_apimodel_kimi';
  if (model && model.trim()) {
    localStorage.setItem(storageKey(key), model.trim());
  } else {
    localStorage.removeItem(storageKey(key));
  }
}

// ==================== AI 建议持久化 ====================

// ==================== AI 建议持久化（仅本地存储） ====================

/**
 * 保存 AI 建议到 localStorage（不上传 D1）
 * @param {string} dateStr — 日期字符串 YYYY-MM-DD
 * @param {object} adviceData — AI 返回的建议数据
 */
function saveAIAdvice(dateStr, adviceData) {
  const wrapper = { data: adviceData, savedAt: Date.now() };
  localStorage.setItem(storageKey('cc_ai_advice_' + dateStr), JSON.stringify(wrapper));
}

/**
 * 从 localStorage 加载 AI 建议
 * @param {string} dateStr — 日期字符串 YYYY-MM-DD
 * @returns {object|null} 建议数据，无则返回 null
 */
function loadAIAdvice(dateStr) {
  try {
    const raw = localStorage.getItem(storageKey('cc_ai_advice_' + dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ==================== 每日食谱持久化（仅本地存储） ====================

/**
 * 保存每日食谱到 localStorage（不上传 D1）
 * @param {string} dateStr — 日期字符串 YYYY-MM-DD
 * @param {object} mealPlanData — AI 返回的食谱数据
 */
function saveMealPlan(dateStr, mealPlanData) {
  const wrapper = { data: mealPlanData, savedAt: Date.now() };
  localStorage.setItem(storageKey('cc_mealplan_' + dateStr), JSON.stringify(wrapper));
}

/**
 * 从 localStorage 加载每日食谱
 * @param {string} dateStr — 日期字符串 YYYY-MM-DD
 * @returns {object|null} 食谱数据，无则返回 null
 */
function loadMealPlan(dateStr) {
  try {
    const raw = localStorage.getItem(storageKey('cc_mealplan_' + dateStr));
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// ==================== API 连接测试 ====================

/**
 * 测试 API Key 是否有效
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function testApiConnection() {
  const apiKey = getApiKey();

  if (!isProxyMode() && !apiKey) {
    return { success: false, error: '请先配置 API Key 或启用代理模式' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(buildRequestUrl(), {
      method: 'POST',
      headers: buildRequestHeaders(apiKey),
      body: JSON.stringify({
        model: getApiModel(),
        messages: [{ role: 'user', content: '回复OK' }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true };
    }

    let errorMsg = 'HTTP ' + response.status;
    try {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch (e) {
        if (text && text.length < 200) errorMsg = text;
      }
    } catch (e) {}
    return { success: false, error: errorMsg };
  } catch (e) {
    if (e.name === 'AbortError') {
      return { success: false, error: '连接超时，请检查网络' };
    }
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      return { success: false, error: '请求被浏览器阻止（CORS 限制）。请在设置中启用「代理模式」，并参考 proxy/ 目录配置转发服务。' };
    }
    return { success: false, error: '网络连接失败：' + e.message };
  }
}

// ==================== API 调用核心 ====================

/**
 * 调用 Kimi API（月之暗面 Moonshot）
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @returns {Promise<object|null>} 解析后的 JSON 响应
 */
async function callAI(messages, options) {
  const opts = options || {};
  const apiKey = getApiKey();

  if (!isProxyMode() && !apiKey) {
    throw new Error('NO_API_KEY');
  }

  const model = opts.model || getApiModel();
  const controller = new AbortController();
  const timeout = opts.timeout || API_TIMEOUT;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body = {
      model: model,
      messages: messages,
      temperature: opts.temperature || 0.3,
      max_tokens: opts.maxTokens || 1024,
    };

    // 请求 JSON 格式输出（Kimi/Moonshot 支持）
    // 注意：使用 json_object 时，消息中需包含 "json" 一词
    if (opts.jsonOutput !== false) {
      const allText = messages.map(m => m.content).join(' ');
      if (/json/i.test(allText)) {
        body.response_format = { type: 'json_object' };
      }
    }

    const response = await fetch(buildRequestUrl(), {
      method: 'POST',
      headers: buildRequestHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = 'HTTP ' + response.status;
      try {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error?.message || errorData.message || errorMsg;
        } catch (e) {
          if (text && text.length < 200) errorMsg = text;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API 返回为空');
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      return { rawText: content };
    }
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    if (e.message === 'NO_API_KEY') {
      throw e;
    }
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('网络请求被阻止（CORS 限制）。请在设置中启用「代理模式」，并参考 proxy/ 目录配置 Nginx 或 Cloudflare Worker 转发。');
    }
    throw new Error('API 调用失败：' + e.message);
  }
}

// ==================== AI 食物估计 ====================

/**
 * AI 智能估计食物营养数据
 *
 * @param {string} description — 用户的自然语言描述
 *   如："今天中午吃了一份青椒炒鸡蛋和一碗米饭"
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 *   data: { foodName, calories, protein, fat, carbs, grams, confidence, note }
 */
async function estimateFood(description) {
  if (!description || !description.trim()) {
    return { success: false, error: '请描述您吃的食物' };
  }

  if (!hasApiKey()) {
    return { success: false, error: 'NO_API_KEY' };
  }

  const systemPrompt = `你是一位专业的营养师和食物热量估算专家。用户会用自然语言描述他们吃的食物，你需要尽可能准确地估计其营养数据。

规则：
1. 仔细分析用户描述中的所有食物成分
2. 估计总热量（kcal）和三大营养素（蛋白质、脂肪、碳水，单位克）
3. 估计总克数
4. 给出置信度（high=常见食物易估计, medium=有一定把握, low=信息不足需猜测）
5. 在note字段中用一句话说明估计依据

请严格返回以下JSON格式（不要额外文字）：
{"foodName":"食物名称概括","calories":数字,"protein":数字,"fat":数字,"carbs":数字,"grams":数字,"confidence":"high|medium|low","note":"简短的估计说明"}`;

  try {
    const result = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请估计这份食物的营养数据：' + description.trim() },
    ]);

    if (!result.foodName || typeof result.calories !== 'number') {
      if (result.rawText) {
        return { success: false, error: 'AI 返回格式异常，请重试' };
      }
      return { success: false, error: 'AI 返回数据不完整，请重试' };
    }

    return {
      success: true,
      data: {
        foodName: result.foodName,
        calories: Math.round(result.calories),
        protein: Math.round(result.protein * 10) / 10,
        fat: Math.round(result.fat * 10) / 10,
        carbs: Math.round(result.carbs * 10) / 10,
        grams: Math.round(result.grams),
        confidence: result.confidence || 'medium',
        note: result.note || '',
      },
    };
  } catch (e) {
    if (e.message === 'NO_API_KEY') {
      return { success: false, error: 'NO_API_KEY' };
    }
    return { success: false, error: e.message };
  }
}

// ==================== AI 智能建议 ====================

/**
 * AI 生成个性化饮食与运动建议
 *
 * @param {object} dailyData — 当日摄入汇总
 *   { totalCal, totalCarbs, totalProtein, totalFat, calorieTarget,
 *     records: [{foodName, calories, carbs, protein, fat, grams, time}] }
 * @param {object} userProfile — 用户身体数据
 *   { goal, gender, age, weight, height }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 *   data: { summary, dietAdvice, exerciseAdvice, tips, foodSuggestions }
 */
async function getAIAdvice(dailyData, userProfile) {
  if (!hasApiKey()) {
    return { success: false, error: 'NO_API_KEY' };
  }

  const carbsCal = dailyData.totalCarbs * 4;
  const proteinCal = dailyData.totalProtein * 4;
  const fatCal = dailyData.totalFat * 9;
  const totalEnergyCal = carbsCal + proteinCal + fatCal || 1;
  const carbsPct = Math.round(carbsCal / totalEnergyCal * 100);
  const proteinPct = Math.round(proteinCal / totalEnergyCal * 100);
  const fatPct = Math.round(fatCal / totalEnergyCal * 100);
  const calPct = Math.round(dailyData.totalCal / dailyData.calorieTarget * 100);

  const goalMap = { lose: '减重', maintain: '保持体重', gain: '增重' };

  const systemPrompt = `你是一位资深营养师和运动教练，专注于根据用户的实际饮食数据提供科学、个性化的建议。参考标准：《中国居民膳食指南（2022）》。

请根据用户提供的数据进行分析，并返回以下 JSON 格式（不要额外文字）：
{
  "summary": "一句话总结今日饮食状况（30字以内）",
  "dietAdvice": "针对性的饮食调整建议（2-3句话，具体可操作）",
  "exerciseAdvice": "运动建议（根据热量盈余/缺口推荐具体运动类型和时长）",
  "tips": ["实用小贴士1", "实用小贴士2", "实用小贴士3"],
  "foodSuggestions": ["推荐食物1", "推荐食物2", "推荐食物3", "推荐食物4"]
}`;

  const userMessage = `用户数据：
- 目标：${goalMap[userProfile.goal] || '保持体重'}
- 性别：${userProfile.gender === 'male' ? '男' : '女'}
- 年龄：${userProfile.age}岁
- 体重：${userProfile.weight}kg
- 身高：${userProfile.height}cm

今日摄入：
- 总热量：${dailyData.totalCal} kcal（目标 ${dailyData.calorieTarget} kcal，达成 ${calPct}%）
- 碳水：${dailyData.totalCarbs}g（供能比 ${carbsPct}%，推荐 50-65%）
- 蛋白质：${dailyData.totalProtein}g（供能比 ${proteinPct}%，推荐 10-20%）
- 脂肪：${dailyData.totalFat}g（供能比 ${fatPct}%，推荐 20-30%）
- 食物记录数：${dailyData.records.length} 项`;

  try {
    const result = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      { maxTokens: 800, temperature: 0.5 }
    );

    if (!result.summary && result.rawText) {
      return { success: true, data: { summary: result.rawText } };
    }

    return {
      success: true,
      data: {
        summary: result.summary || '',
        dietAdvice: result.dietAdvice || '',
        exerciseAdvice: result.exerciseAdvice || '',
        tips: result.tips || [],
        foodSuggestions: result.foodSuggestions || [],
      },
    };
  } catch (e) {
    if (e.message === 'NO_API_KEY') {
      return { success: false, error: 'NO_API_KEY' };
    }
    return { success: false, error: e.message };
  }
}

// ==================== AI 每日食谱计划 ====================

/**
 * AI 生成每日饮食与训练计划
 *
 * @param {object} userProfile — 用户身体数据
 *   { goal, gender, age, weight, height }
 * @param {number} dailyTarget — 每日热量目标（kcal）
 * @param {string} todayIntakeContext — 今日已摄入上下文
 * @param {string} dietaryRestrictions — 用户忌口偏好（可选）
 * @param {string} remainingMeals — 剩余需安排的餐次描述
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 *   data: { breakfast, lunch, dinner, snacks, totalCalories, trainingPlan, dailyTips }
 */
async function getDailyMealPlan(userProfile, dailyTarget, todayIntakeContext, dietaryRestrictions, remainingMeals) {
  if (!hasApiKey()) {
    return { success: false, error: 'NO_API_KEY' };
  }

  const goalMap = { lose: '减重', maintain: '保持体重', gain: '增重' };
  const goalLabel = goalMap[userProfile.goal] || '保持体重';

  const restrictionNote = dietaryRestrictions
    ? `\n⚠️ 用户忌口/偏好：${dietaryRestrictions}。请严格遵守，不要推荐用户不吃的东西。`
    : '';

  const systemPrompt = `你是一位资深营养师和健身教练，专门为用户制定科学的一日饮食与训练计划。参考标准：《中国居民膳食指南（2022）》。

你需要根据用户的身体数据和热量目标，制定一份饮食计划。核心原则：
1. 如果用户已有当日摄入记录，重点为「剩余餐次」提供具体建议，帮助用户平衡全天营养
2. 已经吃过的餐次不需要再规划（标记为"已用过"即可）
3. 剩余餐次的热量总和 + 已摄入热量 ≈ 目标热量
4. 三大营养素比例合理（碳水50-65%，蛋白质10-20%，脂肪20-30%）
5. 食物选择要适合中国饮食习惯，具体到食物名称和份量
6. 训练计划要与用户目标匹配（减重偏有氧，增重偏力量）
7. 严格遵守用户的忌口/偏好要求
8. 每餐和训练都要有简短说明

请严格返回以下 JSON 格式（不要额外文字）：
{
  "breakfast": {"foods": "早餐食物+份量，如已用过写'已用过'","calories": 数字, "note": "简短说明"},
  "lunch": {"foods": "午餐食物+份量，如已用过写'已用过'","calories": 数字, "note": "简短说明"},
  "dinner": {"foods": "晚餐食物+份量，如已用过写'已用过'","calories": 数字, "note": "简短说明"},
  "snacks": {"foods": "加餐食物+份量，如无加餐写'无'","calories": 数字, "note": "简短说明"},
  "totalCalories": 剩余餐次总热量数字（不含已摄入）,
  "trainingPlan": {
    "type": "有氧训练/力量训练/混合训练/休息日",
    "exercises": ["具体动作1", "具体动作2", "具体动作3", "具体动作4"],
    "duration": "约XX分钟",
    "note": "训练说明（强度、注意事项）"
  },
  "dailyTips": ["全天饮食小贴士1", "全天饮食小贴士2"],
  "nextMealSuggestion": "根据用户今日已摄入情况和剩余预算，给出下一餐的具体建议"
}`;

  const userMessage = `用户数据：
- 目标：${goalLabel}
- 性别：${userProfile.gender === 'male' ? '男' : '女'}
- 年龄：${userProfile.age}岁
- 体重：${userProfile.weight}kg
- 身高：${userProfile.height}cm
- 每日热量目标：${dailyTarget} kcal
${restrictionNote}
${remainingMeals || ''}
${todayIntakeContext || ''}
请为这位用户规划今日的饮食和训练计划。`;

  try {
    const result = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      { maxTokens: 1200, temperature: 0.6 }
    );

    if (!result.breakfast && result.rawText) {
      return { success: true, data: { rawText: result.rawText } };
    }

    return {
      success: true,
      data: {
        breakfast: result.breakfast || { foods: '', calories: 0, note: '' },
        lunch: result.lunch || { foods: '', calories: 0, note: '' },
        dinner: result.dinner || { foods: '', calories: 0, note: '' },
        snacks: result.snacks || { foods: '无', calories: 0, note: '' },
        totalCalories: result.totalCalories || 0,
        trainingPlan: result.trainingPlan || { type: '', exercises: [], duration: '', note: '' },
        dailyTips: result.dailyTips || [],
        nextMealSuggestion: result.nextMealSuggestion || '',
      },
    };
  } catch (e) {
    if (e.message === 'NO_API_KEY') {
      return { success: false, error: 'NO_API_KEY' };
    }
    return { success: false, error: e.message };
  }
}
