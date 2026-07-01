/**
 * 热量计算器 — 科学建议引擎
 * Phase 5: 多维度饮食与运动建议
 *
 * 分析维度：
 *   1. 热量分析 — 严重超标 / 超标 / 适中 / 不足
 *   2. 碳水分析 — 偏高 / 适中 / 偏低
 *   3. 蛋白质分析 — 严重不足 / 偏少 / 适中
 *   4. 脂肪分析 — 偏高 / 适中 / 偏低
 *   5. 综合营养均衡判断
 *
 * 参考标准：《中国居民膳食指南（2022）》
 *   碳水供能比 50-65%、蛋白质 10-20%、脂肪 20-30%
 */

'use strict';

// ==================== 运动消耗参考 ====================

/**
 * 常见运动热量消耗参考（以 70kg 体重估算）
 * 单位：kcal / 分钟
 */
const EXERCISE_DATA = {
  running:     { name: '跑步 (8km/h)',  kcalPerMin: 8,   icon: '🏃' },
  walking:     { name: '快走 (6km/h)',  kcalPerMin: 5,   icon: '🚶' },
  swimming:    { name: '游泳',          kcalPerMin: 8.3, icon: '🏊' },
  jumpRope:    { name: '跳绳',          kcalPerMin: 10,  icon: '🪢' },
  cycling:     { name: '骑行 (16km/h)', kcalPerMin: 7,   icon: '🚴' },
  hiit:        { name: 'HIIT 高强度间歇', kcalPerMin: 12, icon: '🔥' },
  stairs:      { name: '爬楼梯',        kcalPerMin: 9,   icon: '🪜' },
  yoga:        { name: '瑜伽',          kcalPerMin: 3.5, icon: '🧘' },
};

/** 按消耗效率排序（高到低），用于运动推荐 */
const EXERCISE_RANKED = Object.values(EXERCISE_DATA)
  .sort((a, b) => b.kcalPerMin - a.kcalPerMin);

// ==================== 食物推荐库 ====================

/** 高蛋白食物推荐 */
const HIGH_PROTEIN_FOODS = [
  '鸡胸肉', '鸡蛋', '牛奶', '豆腐', '鱼肉', '虾仁', '瘦牛肉', '酸奶',
];

/** 高碳水替代建议（用复合碳水替代精制碳水） */
const COMPLEX_CARBS_FOODS = [
  '糙米饭', '全麦面包', '燕麦', '红薯', '玉米', '荞麦面', '小米粥',
];

/** 低脂食物推荐 */
const LOW_FAT_FOODS = [
  '清蒸鱼', '鸡胸肉', '蔬菜沙拉', '冬瓜', '海带', '菌菇类', '魔芋',
];

/** 健康脂肪来源 */
const HEALTHY_FAT_FOODS = [
  '坚果', '牛油果', '橄榄油', '三文鱼', '亚麻籽',
];

/** 高营养密度食物（热量不足时推荐） */
const NUTRIENT_DENSE_FOODS = [
  '鸡蛋', '牛奶', '坚果', '鸡胸肉', '三文鱼', '牛油果', '全麦面包',
];

// ==================== 供能比阈值 ====================

const THRESHOLD = {
  calorie: {
    severeExcess: 1.2,   // >120% 严重超标
    excess:       1.05,  // >105% 超标
    good:         0.85,  // 85-105% 适中
    // <85% 不足（需 >= 3 条记录才提示）
  },
  carbs: {
    high: 65,   // >65% 供能比 → 碳水偏高
    low:  45,   // <45% 供能比 → 碳水偏低（有记录时）
  },
  protein: {
    severeLow: 8,   // <8%  → 严重不足
    low:       12,  // <12% → 偏少
    high:      25,  // >25% → 偏高
  },
  fat: {
    high: 35,  // >35% 供能比 → 脂肪偏高
    low:  15,  // <15% 供能比 → 脂肪偏低（有记录时）
  },
};

// ==================== 建议渲染主入口 ====================

/**
 * 渲染今日科学建议卡片
 * 由 app.js 在初始化、添加/删除食物、切换日期时调用
 */
async function renderAdvice() {
  const records = await getTodayRecords();
  const container = $('advice-cards');

  // 无记录 → 空状态
  if (records.length === 0) {
    container.innerHTML = `
      <div class="advice-card advice-card--info">
        <div class="advice-card-header">
          <span class="advice-icon">💡</span>
          <span class="advice-title">等待记录</span>
        </div>
        <p class="advice-text">添加今日饮食记录后，这里会显示个性化的饮食与运动建议。</p>
      </div>`;
    return;
  }

  // 汇总数据
  const totalCal    = records.reduce((sum, r) => sum + r.calories, 0);
  const totalCarbs  = records.reduce((sum, r) => sum + r.carbs,  0);
  const totalProtein = records.reduce((sum, r) => sum + r.protein, 0);
  const totalFat    = records.reduce((sum, r) => sum + r.fat,    0);

  const calorieTarget = await getCalorieTarget(); // 从用户设置读取
  const calRatio = totalCal / calorieTarget;

  // 各营养素供能比
  const carbsCal   = totalCarbs  * 4;
  const proteinCal = totalProtein * 4;
  const fatCal     = totalFat    * 9;
  const effectiveCal = carbsCal + proteinCal + fatCal; // 实际摄入总热量（由营养素反算）
  const denom = effectiveCal > 0 ? effectiveCal : 1;   // 避免除零

  const carbsPct   = Math.round(carbsCal   / denom * 100);
  const proteinPct = Math.round(proteinCal / denom * 100);
  const fatPct     = 100 - carbsPct - proteinPct; // 确保和为 100%

  // 收集所有分析卡片
  const cards = [];

  // ---- 1. 热量分析 ----
  analyzeCalorie(cards, totalCal, calRatio, calorieTarget);

  // ---- 2. 碳水分析 ----
  analyzeCarbs(cards, carbsPct, totalCal);

  // ---- 3. 蛋白质分析 ----
  analyzeProtein(cards, proteinPct, totalCal);

  // ---- 4. 脂肪分析 ----
  analyzeFat(cards, fatPct, totalCal);

  // ---- 5. 综合营养均衡 ----
  checkOverallBalance(cards, carbsPct, proteinPct, fatPct, calRatio);

  // ---- 6. 运动方案（热量超标时） ----
  if (calRatio >= THRESHOLD.calorie.excess) {
    const excess = totalCal - calorieTarget;
    if (excess > 50) {
      cards.push(buildExerciseCard(excess));
    }
  }

  // ---- 7. 食物补充建议（热量不足时） ----
  if (calRatio < THRESHOLD.calorie.good && records.length >= 3) {
    cards.push(buildFoodSupplementCard(calorieTarget - totalCal));
  }

  // 渲染到 DOM
  container.innerHTML = cards.map(c => `
    <div class="advice-card advice-card--${c.type}">
      <div class="advice-card-header">
        <span class="advice-icon">${c.icon}</span>
        <span class="advice-title">${c.title}</span>
      </div>
      <p class="advice-text">${c.text}</p>
      ${c.extraHTML || ''}
    </div>
  `).join('');

  // 添加 AI 深度分析按钮（仅当日且有记录时显示）
  const isToday = isSameDay(state.currentDate, state.today);
  if (records.length > 0 && isToday) {
    // 检查是否有已保存的 AI 建议
    const dateStr = formatDate(state.currentDate);
    const savedAdvice = loadAIAdvice(dateStr);
    const hasSaved = savedAdvice && savedAdvice.summary;

    container.innerHTML += `
      <div class="ai-advice-area" id="ai-advice-area">
        <button class="ai-advice-btn" id="btn-ai-advice">
          ${hasSaved ? '🤖 重新分析' : '🤖 AI 深度分析'}
        </button>
        <div class="ai-advice-result" id="ai-advice-result" style="${hasSaved ? '' : 'display:none'}"></div>
      </div>`;

    // 如果有已保存的建议，恢复显示
    if (hasSaved) {
      const resultArea = document.getElementById('ai-advice-result');
      if (resultArea) {
        renderAIAdviceResultHTML(resultArea, savedAdvice);
      }
    }

    // 绑定 AI 分析按钮事件
    setTimeout(() => {
      const btn = $('btn-ai-advice');
      if (btn) {
        btn.addEventListener('click', () => requestAIAdvice(records, totalCal, totalCarbs, totalProtein, totalFat, calorieTarget));
      }
    }, 0);
  }
}

// ==================== 1. 热量分析 ====================

function analyzeCalorie(cards, totalCal, ratio, target) {
  if (ratio >= THRESHOLD.calorie.severeExcess) {
    const excess = totalCal - target;
    cards.push({
      icon: '🔴', title: '热量严重超标',
      text: `今日已摄入 ${totalCal} kcal，超出目标 ${excess} kcal（${Math.round((ratio - 1) * 100)}%）。需要关注饮食控制并增加运动量。`,
      type: 'danger',
    });
  } else if (ratio >= THRESHOLD.calorie.excess) {
    const excess = totalCal - target;
    cards.push({
      icon: '⚠️', title: '热量超标',
      text: `今日已超出目标 ${excess} kcal，建议通过运动消耗多余热量，或调整晚餐份量。`,
      type: 'warning',
    });
  } else if (ratio >= THRESHOLD.calorie.good) {
    cards.push({
      icon: '👌', title: '热量适中',
      text: `今日摄入 ${totalCal} kcal，接近目标 ${target} kcal（${Math.round(ratio * 100)}%），控制得当，继续保持！`,
      type: 'good',
    });
  } else if (totalCal > 0) {
    // 已经有记录但不足
    const remain = target - totalCal;
    cards.push({
      icon: 'ℹ️', title: '热量不足',
      text: `距离目标还差 ${remain} kcal（仅 ${Math.round(ratio * 100)}%），可以适当补充一些健康食物，保持代谢水平。`,
      type: 'info',
    });
  }
}

// ==================== 2. 碳水分析 ====================

function analyzeCarbs(cards, carbsPct, totalCal) {
  if (totalCal === 0) return;

  if (carbsPct > THRESHOLD.carbs.high) {
    cards.push({
      icon: '🍚', title: '碳水偏高',
      text: `碳水供能比 ${carbsPct}%，超过推荐上限 65%。建议用糙米饭、全麦面包、红薯等复合碳水替代精制米面，并适当增加蛋白质和蔬菜比例。`,
      type: 'warning',
    });
  } else if (carbsPct < THRESHOLD.carbs.low) {
    cards.push({
      icon: '🌾', title: '碳水偏低',
      text: `碳水供能比仅 ${carbsPct}%，低于推荐下限 45%。碳水化合物是大脑和身体的主要能量来源，建议适量增加全谷物、薯类等健康碳水。`,
      type: 'info',
    });
  }
}

// ==================== 3. 蛋白质分析 ====================

function analyzeProtein(cards, proteinPct, totalCal) {
  if (totalCal === 0) return;

  if (proteinPct < THRESHOLD.protein.severeLow) {
    cards.push({
      icon: '🥩', title: '蛋白质严重不足',
      text: `蛋白质供能比仅 ${proteinPct}%，远低于推荐值。蛋白质不足会影响肌肉修复和免疫力。强烈建议：鸡胸肉、鸡蛋、牛奶、豆腐、鱼肉等。`,
      type: 'danger',
      extraHTML: buildFoodTagList(HIGH_PROTEIN_FOODS, '高蛋白推荐'),
    });
  } else if (proteinPct < THRESHOLD.protein.low) {
    cards.push({
      icon: '🥚', title: '蛋白质偏少',
      text: `蛋白质供能比 ${proteinPct}%，低于推荐下限 12%。每日应保证足够蛋白质摄入，推荐：鸡蛋、鸡胸肉、豆腐、牛奶、鱼肉。`,
      type: 'info',
      extraHTML: buildFoodTagList(HIGH_PROTEIN_FOODS.slice(0, 5), '高蛋白推荐'),
    });
  } else if (proteinPct > THRESHOLD.protein.high) {
    cards.push({
      icon: '💪', title: '蛋白质偏高',
      text: `蛋白质供能比 ${proteinPct}%，高于常规推荐范围。如果正在进行增肌训练则问题不大；否则建议适当降低蛋白质比例，增加碳水和蔬菜。`,
      type: 'info',
    });
  }
}

// ==================== 4. 脂肪分析 ====================

function analyzeFat(cards, fatPct, totalCal) {
  if (totalCal === 0) return;

  if (fatPct > THRESHOLD.fat.high) {
    cards.push({
      icon: '🧈', title: '脂肪偏高',
      text: `脂肪供能比 ${fatPct}%，超过推荐上限 35%。建议减少油炸食品和肥肉，选择清蒸、水煮等低油烹饪方式，多吃蔬菜和瘦肉。`,
      type: 'warning',
    });
  } else if (fatPct < THRESHOLD.fat.low) {
    cards.push({
      icon: '🥑', title: '脂肪偏低',
      text: `脂肪供能比仅 ${fatPct}%，低于推荐下限 15%。健康脂肪对激素代谢至关重要，建议适量摄入坚果、牛油果、橄榄油等优质脂肪来源。`,
      type: 'info',
    });
  }
}

// ==================== 5. 综合营养均衡 ====================

function checkOverallBalance(cards, carbsPct, proteinPct, fatPct, calRatio) {
  const carbsOK   = carbsPct   >= 45 && carbsPct   <= 65;
  const proteinOK = proteinPct >= 12 && proteinPct <= 25;
  const fatOK     = fatPct     >= 15 && fatPct     <= 35;
  const calorieOK = calRatio   >= 0.85 && calRatio  <= 1.05;

  // 只有三个营养素都在合理范围内才显示"全面均衡"
  if (carbsOK && proteinOK && fatOK && calorieOK) {
    cards.push({
      icon: '🎉', title: '营养全面均衡',
      text: `今日三大营养素供能比非常理想！碳水 ${carbsPct}%、蛋白质 ${proteinPct}%、脂肪 ${fatPct}%，均在推荐范围内，继续保持这样的饮食结构。`,
      type: 'good',
    });
    return;
  }

  // 有其他建议卡片时，不额外显示均衡提示
  // 如果只有一个维度有问题，已经通过上面的具体分析卡片提示了
}

// ==================== 6. 运动方案卡片 ====================

function buildExerciseCard(excessKcal) {
  // 选择 top 4 高效率运动
  const exercises = EXERCISE_RANKED.slice(0, 5);

  const rows = exercises.map(ex => {
    const min = Math.ceil(excessKcal / ex.kcalPerMin);
    return `
      <div class="exercise-row">
        <span class="exercise-icon">${ex.icon}</span>
        <span class="exercise-name">${ex.name}</span>
        <span class="exercise-time">约 ${min} 分钟</span>
      </div>`;
  }).join('');

  return {
    icon: '🏋️', title: '运动消耗方案',
    text: `需消耗约 ${excessKcal} kcal 的多余热量，以下是运动参考：`,
    type: 'warning',
    extraHTML: `<div class="exercise-list">${rows}</div>`,
  };
}

// ==================== 7. 食物补充建议 ====================

function buildFoodSupplementCard(remainKcal) {
  const foods = NUTRIENT_DENSE_FOODS.slice(0, 5);
  return {
    icon: '🥗', title: '食物补充建议',
    text: `还差约 ${remainKcal} kcal 达到目标，推荐以下高营养密度食物：`,
    type: 'info',
    extraHTML: buildFoodTagList(foods),
  };
}

// ==================== AI 深度分析 ====================

/**
 * 请求 AI 深度分析建议
 */
async function requestAIAdvice(records, totalCal, totalCarbs, totalProtein, totalFat, calorieTarget) {
  const btn = $('btn-ai-advice');
  const resultArea = $('ai-advice-result');

  // 检查 API Key
  if (!hasApiKey()) {
    resultArea.style.display = 'block';
    resultArea.innerHTML = `
      <div class="advice-card advice-card--info">
        <div class="advice-card-header">
          <span class="advice-icon">🔑</span>
          <span class="advice-title">需要 API Key</span>
        </div>
        <p class="advice-text">请先在设置中配置 Kimi API Key，即可使用 AI 深度分析功能。</p>
      </div>`;
    return;
  }

  // 加载状态
  btn.disabled = true;
  btn.textContent = '⏳ AI 分析中...';
  resultArea.style.display = 'block';
  resultArea.innerHTML = `
    <div class="advice-card advice-card--info">
      <div class="advice-card-header">
        <span class="advice-icon">⏳</span>
        <span class="advice-title">AI 正在分析您的饮食数据...</span>
      </div>
      <p class="advice-text">正在请求 Kimi AI 进行深度分析，请稍候。</p>
    </div>`;

  // 构建每日数据
  const dailyData = {
    totalCal,
    totalCarbs,
    totalProtein,
    totalFat,
    calorieTarget,
    records: records.map(r => ({
      foodName: r.foodName,
      calories: r.calories,
      carbs: r.carbs,
      protein: r.protein,
      fat: r.fat,
      grams: r.grams,
      time: r.time,
    })),
  };

  // 获取用户身体数据
  const userSettings = await getUserSettings();
  const userProfile = {
    goal: userSettings.goal,
    gender: userSettings.gender,
    age: userSettings.age,
    weight: userSettings.weight,
    height: userSettings.height,
  };

  const result = await getAIAdvice(dailyData, userProfile);

  btn.disabled = false;
  btn.textContent = '🤖 AI 深度分析';

  if (!result.success) {
    if (result.error === 'NO_API_KEY') {
      resultArea.innerHTML = `
        <div class="advice-card advice-card--info">
          <div class="advice-card-header">
            <span class="advice-icon">🔑</span>
            <span class="advice-title">需要 API Key</span>
          </div>
          <p class="advice-text">请先在设置中配置 Kimi API Key。</p>
        </div>`;
    } else {
      resultArea.innerHTML = `
        <div class="advice-card advice-card--warning">
          <div class="advice-card-header">
            <span class="advice-icon">⚠️</span>
            <span class="advice-title">AI 分析失败</span>
          </div>
          <p class="advice-text">${result.error || '请求失败，请稍后重试。规则建议仍然可用。'}</p>
        </div>`;
    }
    return;
  }

  // 渲染 AI 结果
  const data = result.data;
  renderAIAdviceResultHTML(resultArea, data);

  // 保存到 localStorage，下次无需重新请求
  const dateStr = formatDate(state.currentDate);
  saveAIAdvice(dateStr, data);

  // 更新按钮文字
  if (btn) {
    btn.textContent = '🤖 重新分析';
  }
}

/**
 * 渲染 AI 建议结果 HTML（供初始化和新请求共用）
 * @param {HTMLElement} container — 结果容器 DOM
 * @param {object} data — { summary, dietAdvice, exerciseAdvice, tips, foodSuggestions }
 */
function renderAIAdviceResultHTML(container, data) {
  const tipsHTML = (data.tips && data.tips.length > 0)
    ? `<div class="ai-tips-list">${data.tips.map(t => `<div class="ai-tip-item">💡 ${t}</div>`).join('')}</div>`
    : '';

  const foodsHTML = (data.foodSuggestions && data.foodSuggestions.length > 0)
    ? buildFoodTagList(data.foodSuggestions, '推荐食物')
    : '';

  container.innerHTML = `
    <div class="advice-card advice-card--ai">
      <div class="advice-card-header">
        <span class="advice-icon">🤖</span>
        <span class="advice-title">AI 深度分析</span>
      </div>
      <p class="advice-text"><strong>📊 总结：</strong>${data.summary || '分析完成'}</p>
      ${data.dietAdvice ? `<p class="advice-text" style="margin-top:8px"><strong>🥗 饮食建议：</strong>${data.dietAdvice}</p>` : ''}
      ${data.exerciseAdvice ? `<p class="advice-text" style="margin-top:8px"><strong>🏃 运动建议：</strong>${data.exerciseAdvice}</p>` : ''}
      ${tipsHTML}
      ${foodsHTML}
      <p class="ai-disclaimer">以上分析由 Kimi AI 生成，仅供参考，不构成专业医疗建议。</p>
    </div>`;
}

// ==================== AI 每日食谱计划 ====================

/**
 * 渲染每日食谱面板
 * 初始化时调用，尝试从 localStorage 恢复当日食谱
 */
async function renderMealPlan() {
  const dateStr = formatDate(state.currentDate);
  const savedPlan = loadMealPlan(dateStr);
  const emptyEl = $('mealplan-empty');
  const resultEl = $('mealplan-result');

  if (!emptyEl || !resultEl) return;

  if (savedPlan) {
    // 有已保存的食谱，直接渲染
    emptyEl.style.display = 'none';
    resultEl.style.display = 'block';
    renderMealPlanResultHTML(resultEl, savedPlan);
  } else {
    // 无食谱，显示空状态
    emptyEl.style.display = '';
    resultEl.style.display = 'none';

    // 绑定生成按钮
    const genBtn = $('btn-generate-mealplan');
    if (genBtn) {
      const newBtn = genBtn.cloneNode(true);
      genBtn.parentNode.replaceChild(newBtn, genBtn);
      newBtn.addEventListener('click', generateMealPlan);
    }
  }
}

/**
 * 生成每日食谱（按钮点击触发）
 */
async function generateMealPlan() {
  const btn = $('btn-generate-mealplan');
  const emptyEl = $('mealplan-empty');
  const resultEl = $('mealplan-result');

  if (!btn || !emptyEl || !resultEl) return;

  // 检查 API Key
  if (!hasApiKey()) {
    emptyEl.innerHTML = `
      <span class="empty-icon">🔑</span>
      <p class="empty-text">请先在设置中配置 Kimi API Key</p>
      <button class="ai-advice-btn" id="btn-generate-mealplan">🤖 生成食谱</button>`;
    const newBtn = $('btn-generate-mealplan');
    if (newBtn) {
      newBtn.addEventListener('click', generateMealPlan);
    }
    return;
  }

  // 加载状态
  btn.disabled = true;
  btn.textContent = '⏳ 生成中...';

  // 获取用户数据和今日目标
  const userSettings = await getUserSettings();
  const userProfile = {
    goal: userSettings.goal,
    gender: userSettings.gender,
    age: userSettings.age,
    weight: userSettings.weight,
    height: userSettings.height,
  };
  const dailyTarget = await getCalorieTarget();

  // 如果是当天，获取今日已摄入记录，为下一餐提供上下文
  const dateStr = formatDate(state.currentDate);
  const isToday = isSameDay(state.currentDate, state.today);
  let todayIntakeContext = '';
  if (isToday) {
    try {
      const todayRecords = await getTodayRecords();
      if (todayRecords.length > 0) {
        const totalCal = todayRecords.reduce((s, r) => s + r.calories, 0);
        const foodList = todayRecords.map(r =>
          `${r.foodName}(${r.servingLabel || r.grams + 'g'}, ${r.calories}kcal)`
        ).join('、');
        todayIntakeContext = `\n今日已摄入：${foodList}。已摄入热量：${totalCal}kcal（目标${dailyTarget}kcal，剩余${dailyTarget - totalCal}kcal）。请为用户的「下一餐」提供针对性建议。`;
      }
    } catch (e) { /* ignore */ }
  }

  const result = await getDailyMealPlan(userProfile, dailyTarget, todayIntakeContext);

  btn.disabled = false;
  btn.textContent = '🤖 重新生成';

  if (!result.success) {
    if (result.error === 'NO_API_KEY') {
      emptyEl.innerHTML = `
        <span class="empty-icon">🔑</span>
        <p class="empty-text">请先在设置中配置 Kimi API Key</p>
        <button class="ai-advice-btn" id="btn-generate-mealplan">🤖 生成食谱</button>`;
    } else {
      emptyEl.innerHTML = `
        <span class="empty-icon">⚠️</span>
        <p class="empty-text">生成失败：${result.error || '请稍后重试'}</p>
        <button class="ai-advice-btn" id="btn-generate-mealplan">🤖 重试</button>`;
    }
    const newBtn = $('btn-generate-mealplan');
    if (newBtn) {
      newBtn.addEventListener('click', generateMealPlan);
    }
    return;
  }

  // 隐藏空状态，显示结果
  emptyEl.style.display = 'none';
  resultEl.style.display = 'block';

  const data = result.data;
  if (data.rawText) {
    resultEl.innerHTML = `
      <div class="advice-card advice-card--ai">
        <div class="advice-card-header">
          <span class="advice-icon">🍽️</span>
          <span class="advice-title">AI 每日食谱</span>
        </div>
        <p class="advice-text">${data.rawText}</p>
      </div>`;
    return;
  }

  renderMealPlanResultHTML(resultEl, data);

  // 保存到 localStorage（dateStr 已在函数开头声明）
  saveMealPlan(dateStr, data);
}

/**
 * 渲染食谱结果 HTML
 * @param {HTMLElement} container
 * @param {object} data — { breakfast, lunch, dinner, snacks, totalCalories, trainingPlan, dailyTips }
 */
function renderMealPlanResultHTML(container, data) {
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎',
  };

  const mealLabels = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snacks: '加餐',
  };

  // 构建每餐卡片
  let mealsHTML = '';
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealKey => {
    const meal = data[mealKey];
    if (!meal) return;
    const icon = mealIcons[mealKey];
    const label = mealLabels[mealKey];
    mealsHTML += `
      <div class="mealplan-meal-card">
        <div class="mealplan-meal-header">
          <span class="mealplan-meal-icon">${icon}</span>
          <span class="mealplan-meal-title">${label}</span>
          <span class="mealplan-meal-cal">${meal.calories || 0} kcal</span>
        </div>
        <p class="mealplan-meal-foods">${meal.foods || ''}</p>
        ${meal.note ? `<p class="mealplan-meal-note">${meal.note}</p>` : ''}
      </div>`;
  });

  // 训练计划
  const tp = data.trainingPlan || {};
  const exercisesHTML = (tp.exercises && tp.exercises.length > 0)
    ? tp.exercises.map(e => `<div class="mealplan-exercise-item">💪 ${e}</div>`).join('')
    : '';

  let trainingHTML = '';
  if (tp.type || exercisesHTML) {
    trainingHTML = `
      <div class="mealplan-training-card">
        <div class="mealplan-meal-header">
          <span class="mealplan-meal-icon">🏋️</span>
          <span class="mealplan-meal-title">今日训练</span>
          <span class="mealplan-meal-cal">${tp.type || ''} ${tp.duration || ''}</span>
        </div>
        ${exercisesHTML ? `<div class="mealplan-exercise-list">${exercisesHTML}</div>` : ''}
        ${tp.note ? `<p class="mealplan-meal-note">${tp.note}</p>` : ''}
      </div>`;
  }

  // 小贴士
  const tipsHTML = (data.dailyTips && data.dailyTips.length > 0)
    ? `<div class="ai-tips-list">${data.dailyTips.map(t => `<div class="ai-tip-item">💡 ${t}</div>`).join('')}</div>`
    : '';

  // 总热量汇总
  const totalCal = data.totalCalories
    || ((data.breakfast?.calories || 0) + (data.lunch?.calories || 0) + (data.dinner?.calories || 0) + (data.snacks?.calories || 0));

  container.innerHTML = `
    <div class="advice-card advice-card--ai">
      <div class="advice-card-header">
        <span class="advice-icon">🍽️</span>
        <span class="advice-title">AI 每日食谱计划</span>
        <span class="mealplan-total">合计 ${totalCal} kcal</span>
      </div>
      <div class="mealplan-meals">
        ${mealsHTML}
      </div>
      ${trainingHTML}
      ${data.nextMealSuggestion ? `<div class="mealplan-next-meal">🍽️ <strong>下一餐建议：</strong>${data.nextMealSuggestion}</div>` : ''}
      ${tipsHTML}
      <p class="ai-disclaimer">以上食谱由 Kimi AI 生成，仅供参考，请根据个人情况调整。</p>
    </div>`;
}

// ==================== 工具函数 ====================

/**
 * 生成食物标签列表 HTML
 * @param {string[]} foods — 食物名称数组
 * @param {string} [label] — 可选小标题
 */
function buildFoodTagList(foods, label) {
  const tags = foods.map(f => `<span class="food-tag">${f}</span>`).join('');
  const heading = label ? `<span class="food-tag-label">${label}：</span>` : '';
  return `<div class="food-tag-list">${heading}<div class="food-tag-row">${tags}</div></div>`;
}
