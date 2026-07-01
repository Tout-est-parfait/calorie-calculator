/**
 * 热量计算器 — 历史记录模块
 * Phase 6: 过往饮食记录查看、7 天统计、日期导航
 *
 * 功能：
 *   1. 扫描 localStorage 中所有日期的饮食记录
 *   2. 7 天统计摘要（均值 / 最高日 / 最低日 / 记录天数）
 *   3. 历史日期列表（按日期倒序，显示每日热量概况）
 *   4. 点击历史日期 → 跳转到对应日期的仪表盘视图
 */

'use strict';

// ==================== 常量 ====================

const STORAGE_PREFIX = 'cc_records_';
const RECENT_DAYS = 7;

// ==================== 数据查询 ====================

/**
 * 扫描 localStorage，获取所有有记录的日期及其数据摘要
 * @returns {Array<{date: string, dateObj: Date, totalCal: number, count: number, records: Array}>}
 */
async function getAllDaySummaries() {
  // 优先尝试 D1 数据库
  try {
    const summaries = await getRecordSummariesDB();
    if (summaries && summaries.length > 0) return summaries;
  } catch (e) { /* fall back to localStorage */ }

  // 回退到 localStorage
  const summaries = [];

  // 根据当前登录状态确定记录键前缀
  const prefix = storageKey(STORAGE_PREFIX);

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;

    const dateStr = key.slice(prefix.length); // 'YYYY-MM-DD'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    try {
      const records = JSON.parse(localStorage.getItem(key)) || [];
      if (records.length === 0) continue;

      const totalCal = records.reduce((sum, r) => sum + (r.calories || 0), 0);
      const totalCarbs  = records.reduce((sum, r) => sum + (r.carbs  || 0), 0);
      const totalProtein = records.reduce((sum, r) => sum + (r.protein || 0), 0);
      const totalFat    = records.reduce((sum, r) => sum + (r.fat    || 0), 0);

      summaries.push({
        date: dateStr,
        dateObj: new Date(dateStr + 'T00:00:00'),
        totalCal,
        totalCarbs,
        totalProtein,
        totalFat,
        count: records.length,
      });
    } catch (e) {
      // 忽略解析失败的数据
    }
  }

  // 按日期倒序排列（最新在前）
  summaries.sort((a, b) => b.dateObj - a.dateObj);
  return summaries;
}

/**
 * 获取最近 N 天的摘要数据（用于统计）
 * @param {number} days — 天数，默认 7
 * @returns {{ summaries: Array, stats: { avg, max, min, daysWithRecords } }}
 */
async function getRecentStats(days) {
  days = days || RECENT_DAYS;
  const allSummaries = await getAllDaySummaries();

  // 生成最近 N 天的日期列表
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentDates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    recentDates.push(d);
  }

  // 匹配有记录的日期
  const recentSummaries = [];
  const summaryMap = {};
  allSummaries.forEach(s => {
    summaryMap[s.date] = s;
  });

  recentDates.forEach(d => {
    const dateStr = formatDate(d);
    if (summaryMap[dateStr]) {
      recentSummaries.push(summaryMap[dateStr]);
    } else {
      recentSummaries.push({
        date: dateStr,
        dateObj: d,
        totalCal: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        count: 0,
      });
    }
  });

  // 只统计有记录的天数
  const daysWithData = recentSummaries.filter(s => s.count > 0);
  const cals = daysWithData.map(s => s.totalCal);

  const stats = {
    avg: cals.length > 0 ? Math.round(cals.reduce((a, b) => a + b, 0) / cals.length) : 0,
    max: cals.length > 0 ? Math.max(...cals) : 0,
    min: cals.length > 0 ? Math.min(...cals) : 0,
    daysWithRecords: daysWithData.length,
  };

  return { summaries: recentSummaries, stats };
}

// ==================== 渲染入口 ====================

/**
 * 渲染历史记录视图（统计卡片 + 日期列表）
 * 由 app.js 在切换到历史记录标签页时调用
 */
async function renderHistory() {
  const allSummaries = await getAllDaySummaries();
  const { stats } = await getRecentStats(RECENT_DAYS);

  // 1. 更新统计卡片
  renderHistoryStats(stats);

  // 2. 渲染历史日期列表
  await renderHistoryList(allSummaries);
}

// ==================== 7 天统计卡片 ====================

function renderHistoryStats(stats) {
  $('stat-avg').textContent = stats.avg || '--';
  $('stat-max').textContent = stats.max || '--';
  $('stat-min').textContent = stats.min || '--';
  $('stat-days').textContent = stats.daysWithRecords;
}

// ==================== 历史日期列表 ====================

async function renderHistoryList(summaries) {
  const listEl = $('history-list');

  if (summaries.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p class="empty-text">还没有饮食记录</p>
        <p class="empty-hint">开始搜索食物并添加到今日列表吧</p>
      </div>`;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = await getCalorieTarget(); // 从用户设置读取

  listEl.innerHTML = summaries.map(s => {
    const dayLabel = getDayLabel(s.dateObj, today);
    const weekDay = getWeekDay(s.dateObj);
    const ratio = s.totalCal / target;
    const statusClass = getCalorieStatusClass(ratio);
    const statusText  = getCalorieStatusText(ratio);
    const dateDisplay = `${s.dateObj.getMonth() + 1}月${s.dateObj.getDate()}日`;

    return `
      <div class="history-day-item" data-date="${s.date}">
        <div class="history-day-left">
          <div class="history-day-date">${dateDisplay} <span class="history-day-weekday">${weekDay}</span></div>
          <div class="history-day-meta">${s.count} 项记录</div>
        </div>
        <div class="history-day-right">
          <span class="history-day-cal">${s.totalCal}</span>
          <span class="history-day-unit">kcal</span>
          <span class="history-day-badge ${statusClass}">${statusText}</span>
        </div>
        <span class="history-day-arrow">›</span>
      </div>`;
  }).join('');

  // 绑定点击事件：跳转到对应日期
  listEl.querySelectorAll('.history-day-item').forEach(item => {
    item.addEventListener('click', () => {
      const dateStr = item.dataset.date;
      navigateToDate(dateStr);
    });
  });
}

// ==================== 日期导航 ====================

/**
 * 点击历史日期 → 跳转到该日期的仪表盘
 * @param {string} dateStr — 'YYYY-MM-DD'
 */
function navigateToDate(dateStr) {
  const parts = dateStr.split('-');
  state.currentDate = new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );
  updateDateDisplay();
  refreshView(); // 刷新仪表盘 + 建议 + 摄入列表

  // 切换回仪表盘标签页
  switchToDashboardTab();
}

// ==================== 工具函数 ====================

/**
 * 格式化日期为 YYYY-MM-DD
 * （与 app.js 中的 formatDate 保持一致）
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 星期几 */
function getWeekDay(dateObj) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dateObj.getDay()];
}

/** 相对日期标签 */
function getDayLabel(dateObj, today) {
  const diff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === 2) return '前天';
  if (diff <= 7) return diff + '天前';
  return '';
}

/** 热量状态样式类 */
function getCalorieStatusClass(ratio) {
  if (ratio === 0) return 'badge--empty';
  if (ratio >= 1.1) return 'badge--over';
  if (ratio >= 0.85) return 'badge--good';
  return 'badge--under';
}

/** 热量状态文字 */
function getCalorieStatusText(ratio) {
  if (ratio === 0) return '无记录';
  if (ratio >= 1.1) return '超标';
  if (ratio >= 0.85) return '达标';
  return '不足';
}

/**
 * 切换回仪表盘标签页（更新底部导航按钮状态）
 * 供 history.js 内部使用，避免循环依赖
 */
function switchToDashboardTab() {
  state.activeTab = 'dashboard';
  const btns = document.querySelectorAll('.bottom-nav-btn');
  btns.forEach(btn => {
    const isActive = btn.dataset.tab === 'dashboard';
    btn.classList.toggle('bottom-nav-btn--active', isActive);
  });
  // 显示仪表盘视图、隐藏历史视图
  showDashboardView();
}
