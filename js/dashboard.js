/**
 * 热量计算器 — 仪表盘模块
 * Phase 4: 热量仪表盘增强（营养素达标率、详细占比可视化）
 *
 * 功能：
 *   1. 环形进度条 — 已摄入 vs 目标热量
 *   2. 三大营养素卡片 — 实际摄入量 + 达标率 + 迷你进度条
 *   3. 供能比例条 — 碳水/蛋白质/脂肪 三大营养素供能占比可视化
 *
 * 营养目标参考《中国居民膳食指南》：
 *   碳水 55% 供能（4 kcal/g）
 *   蛋白质 15% 供能（4 kcal/g）
 *   脂肪 30% 供能（9 kcal/g）
 */

'use strict';

// ==================== 营养素目标计算 ====================

/**
 * 根据每日热量目标，推算三大营养素的推荐摄入克数
 * @param {number} calorieTarget — 每日热量目标（kcal）
 * @returns {{ carbs: number, protein: number, fat: number }}
 */
function getMacroTargets(calorieTarget) {
  return {
    carbs:   Math.round(calorieTarget * 0.55 / 4),  // 碳水供能 55%，每克 4 kcal
    protein: Math.round(calorieTarget * 0.15 / 4),  // 蛋白质供能 15%，每克 4 kcal
    fat:     Math.round(calorieTarget * 0.30 / 9),  // 脂肪供能 30%，每克 9 kcal
  };
}

// ==================== 仪表盘主渲染 ====================

/**
 * 渲染整个仪表盘
 * 由 app.js 在初始化、添加/删除食物、切换日期时调用
 */
function renderDashboard() {
  const records = getTodayRecords();

  // 汇总计算
  const totalCal    = records.reduce((sum, r) => sum + r.calories, 0);
  const totalCarbs  = records.reduce((sum, r) => sum + r.carbs,  0);
  const totalProtein = records.reduce((sum, r) => sum + r.protein, 0);
  const totalFat    = records.reduce((sum, r) => sum + r.fat,    0);

  // 读取热量目标（从用户设置，settings.js 提供）
  const calorieTarget = getCalorieTarget();
  const targets = getMacroTargets(calorieTarget);

  // 1. 环形进度条
  updateCalorieRing(totalCal, calorieTarget);

  // 2. 三大营养素卡片（含达标率 + 迷你进度条）
  updateMacroCard('carbs',   totalCarbs,  targets.carbs);
  updateMacroCard('protein', totalProtein, targets.protein);
  updateMacroCard('fat',     totalFat,    targets.fat);

  // 3. 供能比例条
  updateMacroRatio(totalCal, totalCarbs, totalProtein, totalFat);
}

// ==================== 环形进度条 ====================

/**
 * 更新热量环形进度条
 * @param {number} current — 已摄入热量
 * @param {number} target  — 目标热量
 */
function updateCalorieRing(current, target) {
  $('calorie-current').textContent = current;
  $('calorie-target').textContent = target;

  const ratio = Math.min(current / target, 1);
  const circumference = 326.73; // 2 * π * 52（SVG 圆半径）
  const offset = circumference * (1 - ratio);
  $('ring-fill').style.strokeDashoffset = offset;

  // 根据进度变色
  const ring = $('ring-fill');
  const value = $('calorie-current');

  if (ratio >= 1) {
    ring.style.stroke = 'var(--color-danger)';
    value.style.color = 'var(--color-danger)';
  } else if (ratio >= 0.8) {
    ring.style.stroke = 'var(--color-warning)';
    value.style.color = 'var(--color-warning)';
  } else {
    ring.style.stroke = 'var(--color-primary)';
    value.style.color = 'var(--text-primary)';
  }
}

// ==================== 营养素卡片 ====================

/**
 * 更新单个营养素卡片：数值、达标率、迷你进度条、颜色状态
 * @param {string} type   — 'carbs' | 'protein' | 'fat'
 * @param {number} actual — 实际摄入克数
 * @param {number} target — 推荐摄入克数
 */
function updateMacroCard(type, actual, target) {
  const ratio = target > 0 ? Math.min(actual / target, 1.5) : 0;
  const pct   = target > 0 ? Math.round(actual / target * 100) : 0;

  // 数值
  $('macro-' + type).textContent = Math.round(actual * 10) / 10;
  // 目标克数
  $('macro-' + type + '-target').textContent = target + 'g';
  // 达标百分比
  $('macro-' + type + '-pct').textContent = pct + '%';
  // 迷你进度条宽度
  $('macro-' + type + '-bar').style.width = Math.round(ratio * 100) + '%';

  // 颜色状态：偏低(橙) / 达标(绿) / 超标(红)
  const bar = $('macro-' + type + '-bar');
  bar.classList.remove('macro-bar--low', 'macro-bar--good', 'macro-bar--over');

  if (pct >= 110) {
    bar.classList.add('macro-bar--over');
    $('macro-' + type + '-pct').style.color = 'var(--color-danger)';
  } else if (pct >= 80) {
    bar.classList.add('macro-bar--good');
    $('macro-' + type + '-pct').style.color = 'var(--color-primary)';
  } else if (actual > 0) {
    bar.classList.add('macro-bar--low');
    $('macro-' + type + '-pct').style.color = 'var(--color-warning)';
  } else {
    $('macro-' + type + '-pct').style.color = 'var(--text-secondary)';
  }
}

// ==================== 供能比例条 ====================

/**
 * 更新三大营养素供能比例条（碳水 / 蛋白质 / 脂肪）
 * 展示实际摄入中，各营养素提供的热量占比
 *
 * @param {number} totalCal    — 总热量
 * @param {number} totalCarbs  — 碳水总克数
 * @param {number} totalProtein — 蛋白质总克数
 * @param {number} totalFat    — 脂肪总克数
 */
function updateMacroRatio(totalCal, totalCarbs, totalProtein, totalFat) {
  if (totalCal === 0) {
    // 无记录时全部归零
    $('ratio-carbs').style.width = '0%';
    $('ratio-protein').style.width = '0%';
    $('ratio-fat').style.width = '0%';
    $('ratio-carbs-pct').textContent = '0%';
    $('ratio-protein-pct').textContent = '0%';
    $('ratio-fat-pct').textContent = '0%';
    return;
  }

  // 各营养素提供的热量
  const carbsCal   = totalCarbs  * 4;
  const proteinCal = totalProtein * 4;
  const fatCal     = totalFat    * 9;

  // 计算整数百分比，脂肪占比用 100% 减去前两者确保总和为 100%
  const carbsPct   = Math.round(carbsCal / totalCal * 100);
  const proteinPct = Math.round(proteinCal / totalCal * 100);
  const fatPct     = Math.max(0, 100 - carbsPct - proteinPct);

  // 更新比例条宽度
  $('ratio-carbs').style.width   = carbsPct + '%';
  $('ratio-protein').style.width = proteinPct + '%';
  $('ratio-fat').style.width     = fatPct + '%';

  // 更新图例百分比文字
  $('ratio-carbs-pct').textContent   = carbsPct + '%';
  $('ratio-protein-pct').textContent = proteinPct + '%';
  $('ratio-fat-pct').textContent     = fatPct + '%';
}
