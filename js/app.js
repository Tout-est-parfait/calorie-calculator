/**
 * 热量计算器 — 应用入口
 * Phase 1: 项目骨架，基础交互
 */

'use strict';

// ==================== 全局状态 ====================
const state = {
  currentDate: new Date(),        // 当前查看的日期
  today: new Date(),              // 实际今天（用于判断"今天"标签）
  activeTab: 'dashboard',         // 当前底部导航页: 'dashboard' | 'history'
  selectedFood: null,             // 当前选中待添加的食物
  searchQuery: '',                // 搜索输入
};

// ==================== 初始化 ====================
async function init() {
  // 检查是否已登录（有有效会话）
  if (isLoggedIn()) {
    // 已有会话，直接进入
    hideAuthScreen();
    await initApp();
  } else {
    // 未登录，显示登录界面
    showAuthScreen();
  }
}

/** 初始化应用主体（认证之后调用） */
async function initApp() {
  const user = getCurrentUser();
  console.log('热量计算器 v1.0 — Phase 10 多用户登录系统');
  console.log('当前日期:', formatDateStr(state.currentDate));
  if (user) {
    console.log('当前用户:', user.username);
  } else {
    console.log('匿名模式');
  }

  await initDB();

  updateDateDisplay();
  await renderIntakeList();
  await renderDashboard();
  await renderAdvice();
  bindEvents();
}

// ==================== 认证界面控制 ====================

/** 显示登录/注册界面 */
function showAuthScreen() {
  const authScreen = $('auth-screen');
  if (authScreen) authScreen.style.display = 'flex';
}

/** 隐藏登录/注册界面 */
function hideAuthScreen() {
  const authScreen = $('auth-screen');
  if (authScreen) authScreen.style.display = 'none';
}

/** 认证成功后进入应用 */
async function onAuthSuccess() {
  hideAuthScreen();
  await initApp();
  // 显示欢迎提示
  const user = getCurrentUser();
  if (user) {
    setTimeout(() => showToast('欢迎回来，' + user.username + '！', 'success'), 500);
  }
}

/** 匿名跳过（已禁用：必须登录使用） */
// onAuthSkip 已移除 — 应用要求用户登录

// ==================== 认证事件绑定 ====================
function bindAuthEvents() {
  // 切换登录/注册面板
  $('auth-switch-register').addEventListener('click', () => {
    $('auth-panel-login').style.display = 'none';
    $('auth-panel-register').style.display = 'flex';
    $('auth-error-login').textContent = '';
    $('auth-error-register').textContent = '';
  });

  $('auth-switch-login').addEventListener('click', () => {
    $('auth-panel-register').style.display = 'none';
    $('auth-panel-login').style.display = 'flex';
    $('auth-error-login').textContent = '';
    $('auth-error-register').textContent = '';
  });

  // 登录按钮
  $('auth-btn-login').addEventListener('click', async () => {
    const username = $('auth-username-login').value;
    const password = $('auth-password-login').value;
    const errorEl = $('auth-error-login');

    errorEl.textContent = '';
    $('auth-btn-login').disabled = true;
    $('auth-btn-login').textContent = '登录中...';

    const result = await loginUser(username, password);

    if (result.success) {
      // 清空表单
      $('auth-username-login').value = '';
      $('auth-password-login').value = '';
      await onAuthSuccess();
    } else {
      errorEl.textContent = result.error;
      $('auth-btn-login').disabled = false;
      $('auth-btn-login').textContent = '登 录';
    }
  });

  // 注册按钮
  $('auth-btn-register').addEventListener('click', async () => {
    const username = $('auth-username-reg').value;
    const password = $('auth-password-reg').value;
    const password2 = $('auth-password-reg2').value;
    const errorEl = $('auth-error-register');

    errorEl.textContent = '';

    // 确认密码一致
    if (password !== password2) {
      errorEl.textContent = '两次输入的密码不一致';
      return;
    }

    $('auth-btn-register').disabled = true;
    $('auth-btn-register').textContent = '注册中...';

    const result = await registerUser(username, password);

    if (result.success) {
      // 清空表单
      $('auth-username-reg').value = '';
      $('auth-password-reg').value = '';
      $('auth-password-reg2').value = '';
      await onAuthSuccess();
    } else {
      errorEl.textContent = result.error;
      $('auth-btn-register').disabled = false;
      $('auth-btn-register').textContent = '注 册';
    }
  });

  // 回车键快捷登录
  $('auth-password-login').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('auth-btn-login').click();
  });
  // 回车键快捷注册
  $('auth-password-reg2').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('auth-btn-register').click();
  });

  // 匿名跳过已移除 — 必须登录才能使用
}

// ==================== 工具函数 ====================

/** 格式化日期为 YYYY-MM-DD */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 格式化日期为可读字符串 */
function formatDateStr(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

/** 判断两个日期是否是同一天 */
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** 生成唯一 ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/** Toast 通知 */
function showToast(message, type) {
  type = type || '';
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.textContent = message;
  container.appendChild(toast);

  // 1.8 秒后自动消失
  setTimeout(() => {
    toast.classList.add('toast--leaving');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 1800);
}

// ==================== DOM 引用 ====================
function $(id) {
  return document.getElementById(id);
}

// ==================== 日期导航 ====================
function updateDateDisplay() {
  const display = $('date-display');
  const dateText = display.querySelector('.date-text');
  const dateLabel = display.querySelector('.date-label');

  dateText.textContent = formatDateStr(state.currentDate);

  if (isSameDay(state.currentDate, state.today)) {
    dateLabel.textContent = '今天';
  } else {
    const diff = Math.floor((state.today - state.currentDate) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      dateLabel.textContent = '昨天';
    } else if (diff === -1) {
      dateLabel.textContent = '明天';
    } else {
      dateLabel.textContent = '';
    }
  }
}

function goPrevDay() {
  state.currentDate.setDate(state.currentDate.getDate() - 1);
  updateDateDisplay();
  refreshView();
}

function goNextDay() {
  // 不允许查看未来日期
  const tomorrow = new Date(state.today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (state.currentDate >= tomorrow) return;

  state.currentDate.setDate(state.currentDate.getDate() + 1);
  updateDateDisplay();
  refreshView();
}

/** 日期切换后刷新列表、仪表盘、建议 */
async function refreshView() {
  await renderIntakeList();
  await renderDashboard();
  await renderAdvice();
  // 仅在 AI 食谱 Tab 激活时刷新食谱
  if (state.activeTab === 'mealplan') {
    await renderMealPlan();
  }
  // 更新 AI 食谱 Tab 和 AI 建议区域可见性
  const isToday = isSameDay(state.currentDate, state.today);
  const isPast = state.currentDate < state.today && !isToday;
  $('advice-section').style.display = isToday ? 'flex' : 'none';
  const mealplanBtn = document.querySelector('.bottom-nav-btn[data-tab="mealplan"]');
  if (mealplanBtn) {
    mealplanBtn.style.display = isPast ? 'none' : '';
    // 如果当前在食谱Tab但日期是过去，自动切回仪表盘
    if (isPast && state.activeTab === 'mealplan') {
      switchTab('dashboard');
    }
  }
}

// ==================== 底部导航 ====================
function switchTab(tab) {
  if (state.activeTab === tab) return;
  state.activeTab = tab;

  // 更新底部导航按钮激活态
  const btns = document.querySelectorAll('.bottom-nav-btn');
  btns.forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('bottom-nav-btn--active', isActive);
  });

  // 控制 AI 食谱 Tab 可见性：仅当天及未来显示
  const mealplanBtn = document.querySelector('.bottom-nav-btn[data-tab="mealplan"]');
  if (mealplanBtn) {
    const isPast = state.currentDate < state.today && !isSameDay(state.currentDate, state.today);
    mealplanBtn.style.display = isPast ? 'none' : '';
  }

  if (tab === 'history') {
    showHistoryView();
  } else if (tab === 'mealplan') {
    showMealPlanView();
  } else {
    showDashboardView();
  }
}

/** 显示仪表盘视图（搜索 + 摄入列表 + 仪表盘 + 建议） */
function showDashboardView() {
  const isToday = isSameDay(state.currentDate, state.today);

  $('dashboard').style.display = 'flex';
  $('search-section').style.display = 'block';
  $('intake-section').style.display = 'flex';
  // AI 建议仅当日可见
  $('advice-section').style.display = isToday ? 'flex' : 'none';
  $('history-view').style.display = 'none';
  $('mealplan-section').style.display = 'none';
  // 恢复日期导航，隐藏返回按钮
  $('btn-prev-day').style.display = '';
  $('btn-next-day').style.display = '';
  $('btn-back').style.display = 'none';

  // 底部导航：AI 食谱 Tab 仅在当天及未来可见
  const mealplanBtn = document.querySelector('.bottom-nav-btn[data-tab="mealplan"]');
  if (mealplanBtn) {
    const isPast = state.currentDate < state.today && !isSameDay(state.currentDate, state.today);
    mealplanBtn.style.display = isPast ? 'none' : '';
  }
}

/** 显示历史记录视图 */
async function showHistoryView() {
  $('dashboard').style.display = 'none';
  $('search-section').style.display = 'none';
  $('intake-section').style.display = 'none';
  $('advice-section').style.display = 'none';
  $('history-view').style.display = 'flex';
  $('mealplan-section').style.display = 'none';
  // 隐藏日期导航，显示返回按钮
  $('btn-prev-day').style.display = 'none';
  $('btn-next-day').style.display = 'none';
  $('btn-back').style.display = '';
  await renderHistory();
}

/** 显示 AI 食谱视图 */
async function showMealPlanView() {
  $('dashboard').style.display = 'none';
  $('search-section').style.display = 'none';
  $('intake-section').style.display = 'none';
  $('advice-section').style.display = 'none';
  $('history-view').style.display = 'none';
  $('mealplan-section').style.display = 'block';
  // 隐藏日期导航，显示返回按钮
  $('btn-prev-day').style.display = 'none';
  $('btn-next-day').style.display = 'none';
  $('btn-back').style.display = '';
  await renderMealPlan();
}

// ==================== 搜索栏交互 ====================
async function onSearchInput(e) {
  const value = e.target.value.trim();
  state.searchQuery = value;

  // 清除按钮显隐
  $('search-clear').style.display = value ? 'flex' : 'none';

  if (value) {
    // 融合内置数据库 + 自定义食物
    const builtIn = searchFoods(value);
    const custom = await searchCustomFoods(value);
    const results = [...builtIn, ...custom];
    renderSearchResults(results);
    $('search-results').style.display = 'block';
  } else {
    $('search-results').style.display = 'none';
  }
}

function renderSearchResults(results) {
  const list = $('search-results-list');
  if (results.length === 0) {
    list.innerHTML = '<div class="search-result-item" style="color:var(--text-secondary)">未找到，试试自定义添加 👇</div>';
    return;
  }
  list.innerHTML = results.map(food => {
    const isCustom = food.category === 'custom';
    const cat = CATEGORIES[food.category];
    const catName = cat ? cat.name : '';
    const customBadge = isCustom ? '<span class="search-result-custom-badge">自定义</span>' : '';
    const deleteBtn = isCustom
      ? `<button class="search-result-delete" data-delete-id="${food.id}" title="删除">×</button>`
      : '';
    return `
      <div class="search-result-item" data-food-id="${food.id}">
        <span class="search-result-name">${food.name}${customBadge}</span>
        <div class="search-result-sub">
          <span class="search-result-calories">${food.cal} kcal/100g</span>
          <span class="search-result-category">${catName}</span>
        </div>
        ${deleteBtn}
      </div>`;
  }).join('');

  // 绑定自定义食物删除按钮事件
  list.querySelectorAll('.search-result-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // 防止冒泡触发食物选择
      const id = btn.dataset.deleteId;
      if (await deleteCustomFood(id)) {
        // 删除后刷新搜索结果
        const value = state.searchQuery;
        if (value) {
          const builtIn = searchFoods(value);
          const custom = await searchCustomFoods(value);
          renderSearchResults([...builtIn, ...custom]);
        }
      }
    });
  });

  // 点击搜索结果 → 弹出份量选择
  list.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', async () => {
      // 优先从内置数据库查找，否则从自定义食物查找
      let food = getFoodById(item.dataset.foodId);
      if (!food) food = await getCustomFoodById(item.dataset.foodId);
      if (food) showServingModal(food);
    });
  });
}

function clearSearch() {
  const input = $('search-input');
  input.value = '';
  state.searchQuery = '';
  $('search-clear').style.display = 'none';
  $('search-results').style.display = 'none';
  input.focus();
}

// ==================== AI 智能估计弹窗 ====================
let aiEstimateResult = null; // 暂存 AI 估计结果

/** 打开 AI 估计弹窗 */
function openAIEstimateModal() {
  // 重置状态
  aiEstimateResult = null;
  $('ai-estimate-input').value = '';
  $('ai-char-count').textContent = '0';
  $('ai-estimate-result').style.display = 'none';
  $('ai-estimate-error').style.display = 'none';
  $('btn-ai-submit').style.display = 'flex';
  $('btn-ai-confirm').style.display = 'none';
  $('ai-estimate-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  $('ai-estimate-input').focus();
}

/** 关闭 AI 估计弹窗 */
function closeAIEstimateModal() {
  aiEstimateResult = null;
  $('ai-estimate-modal').style.display = 'none';
  document.body.style.overflow = '';
}

/** 提交 AI 食物估计 */
async function submitAIEstimate() {
  const description = $('ai-estimate-input').value.trim();

  if (!description) {
    showAIEstimateError('请描述您吃的食物');
    return;
  }

  if (description.length < 3) {
    showAIEstimateError('描述太短，请提供更多信息（如食物名称、份量）');
    return;
  }

  // 检查 API Key
  if (!hasApiKey()) {
    showAIEstimateError('请先在设置中配置 Kimi API Key');
    return;
  }

  // UI 加载状态
  $('btn-ai-submit').disabled = true;
  $('btn-ai-submit').textContent = 'AI 估计中...';
  $('ai-estimate-error').style.display = 'none';
  $('ai-estimate-result').style.display = 'none';

  const result = await estimateFood(description);

  $('btn-ai-submit').disabled = false;
  $('btn-ai-submit').textContent = '开始估计';

  if (!result.success) {
    if (result.error === 'NO_API_KEY') {
      showAIEstimateError('请先在设置中配置 Kimi API Key');
    } else {
      showAIEstimateError(result.error || '估计失败，请稍后重试');
    }
    return;
  }

  // 显示结果
  aiEstimateResult = result.data;
  renderAIEstimateResult(result.data);
}

/** 渲染 AI 估计结果 */
function renderAIEstimateResult(data) {
  $('ai-result-name').textContent = data.foodName;
  $('ai-result-cal').textContent = data.calories;
  $('ai-result-protein').textContent = data.protein;
  $('ai-result-fat').textContent = data.fat;
  $('ai-result-carbs').textContent = data.carbs;

  // 置信度标签
  const confEl = $('ai-result-confidence');
  const confMap = {
    high: '高置信度',
    medium: '中等置信度',
    low: '仅供参考',
  };
  confEl.textContent = confMap[data.confidence] || '中等置信度';
  confEl.className = 'ai-result-confidence confidence--' + (data.confidence || 'medium');

  // 估计说明
  if (data.note) {
    $('ai-result-note').textContent = '💡 ' + data.note;
    $('ai-result-note').style.display = 'block';
  } else {
    $('ai-result-note').style.display = 'none';
  }

  // 显示结果区域
  $('ai-estimate-result').style.display = 'flex';

  // 切换按钮
  $('btn-ai-submit').style.display = 'none';
  $('btn-ai-confirm').style.display = 'flex';
}

/** 显示 AI 估计错误 */
function showAIEstimateError(msg) {
  $('ai-estimate-error').textContent = '⚠️ ' + msg;
  $('ai-estimate-error').style.display = 'flex';
}

/** 确认添加 AI 估计的食物 */
async function confirmAIEstimate() {
  if (!aiEstimateResult) return;

  const data = aiEstimateResult;

  // 创建摄入记录（类似 confirmAddFood 但数据来源是 AI 估计）
  const record = {
    id: generateId(),
    foodId: 'ai_' + Date.now().toString(36),
    foodName: data.foodName,
    category: 'custom',
    grams: data.grams || 200,
    servingLabel: (data.grams || 200) + 'g',
    calories: data.calories,
    carbs: data.carbs,
    protein: data.protein,
    fat: data.fat,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };

  await addIntakeRecord(record);

  // Toast 反馈
  const confNote = data.confidence === 'low' ? '（仅供参考）' : '';
  showToast('AI 估计：' + record.foodName + ' ' + record.calories + ' kcal' + confNote, 'success');

  // 关闭弹窗
  closeAIEstimateModal();
  aiEstimateResult = null;
}

// ==================== 份量弹窗 ====================
let selectedServingGrams = 0;
let selectedServingIndex = -1;

function showServingModal(food) {
  state.selectedFood = food;
  selectedServingGrams = 0;
  selectedServingIndex = -1;

  $('serving-food-name').textContent = food.name;

  // 渲染份量选项
  const optionsContainer = $('serving-options');
  optionsContainer.innerHTML = food.servings.map((s, i) =>
    `<button class="serving-option" data-index="${i}" data-grams="${s.g}">
      ${s.label}<br><small>${s.g}g · ${Math.round(food.cal * s.g / 100)} kcal</small>
    </button>`
  ).join('');

  // 份量点击
  optionsContainer.querySelectorAll('.serving-option').forEach(btn => {
    btn.addEventListener('click', () => {
      optionsContainer.querySelectorAll('.serving-option').forEach(b => b.classList.remove('serving-option--selected'));
      btn.classList.add('serving-option--selected');
      selectedServingGrams = parseInt(btn.dataset.grams);
      selectedServingIndex = parseInt(btn.dataset.index);
      $('serving-custom-grams').value = ''; // 清除自定义输入
    });
  });

  // 重置自定义输入
  $('serving-custom-grams').value = '';

  $('serving-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideServingModal() {
  state.selectedFood = null;
  selectedServingGrams = 0;
  selectedServingIndex = -1;
  $('serving-modal').style.display = 'none';
  document.body.style.overflow = '';
}

/** 确认添加食物到今日列表 */
async function confirmAddFood() {
  const food = state.selectedFood;
  if (!food) return;

  // 确定克数：优先自定义输入，否则选中的份量
  const customGrams = parseInt($('serving-custom-grams').value);
  let grams = 0;
  let servingLabel = '';

  if (customGrams > 0) {
    grams = customGrams;
    servingLabel = grams + 'g';
  } else if (selectedServingGrams > 0) {
    grams = selectedServingGrams;
    const sv = food.servings[selectedServingIndex];
    servingLabel = sv ? sv.label : grams + 'g';
  }

  if (grams <= 0) {
    // 未选择份量，提示
    alert('请选择一个份量或输入自定义克数');
    return;
  }

  // 计算营养素
  const nutrition = calcNutrition(food, grams);

  // 创建摄入记录
  const record = {
    id: generateId(),
    foodId: food.id,
    foodName: food.name,
    category: food.category,
    grams: grams,
    servingLabel: servingLabel,
    calories: nutrition.calories,
    carbs: nutrition.carbs,
    protein: nutrition.protein,
    fat: nutrition.fat,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  };

  // 添加到当日记录
  await addIntakeRecord(record);

  // Toast 反馈
  showToast('已添加：' + record.foodName + ' ' + record.calories + ' kcal', 'success');

  // 关闭弹窗并清除搜索
  hideServingModal();
  clearSearch();
  state.searchQuery = '';
  $('search-input').value = '';
}

// ==================== 摄入记录管理 ====================
/** 获取当日所有记录 */
async function getTodayRecords() {
  return await getRecordsDB(formatDate(state.currentDate));
}

/** 保存当日记录 */
async function saveTodayRecords(records) {
  const key = storageKey('cc_records_' + formatDate(state.currentDate));
  localStorage.setItem(key, JSON.stringify(records));
}

/** 添加一条摄入记录 */
async function addIntakeRecord(record) {
  const dateStr = formatDate(state.currentDate);
  await addRecordDB(dateStr, record);
  await renderIntakeList();
  await renderDashboard();
  await renderAdvice();
}

/** 删除一条摄入记录（带动画） */
async function removeIntakeRecord(recordId) {
  // 先给列表项添加移除动画
  const item = document.querySelector('.intake-item-delete[data-id="' + recordId + '"]');
  if (item) {
    const listItem = item.closest('.intake-item');
    if (listItem) {
      listItem.classList.add('intake-item--removing');
      // 动画结束后再真正删除
      setTimeout(async () => {
        const records = await getTodayRecords();
        const filtered = records.filter(r => r.id !== recordId);
        await deleteRecordDB(formatDate(state.currentDate), recordId);
        await renderIntakeList();
        await renderDashboard();
        await renderAdvice();
        showToast('已删除', 'warning');
      }, 230);
      return;
    }
  }
  // 降级：直接删除
  const records = await getTodayRecords();
  const filtered = records.filter(r => r.id !== recordId);
  await deleteRecordDB(formatDate(state.currentDate), recordId);
  await renderIntakeList();
  await renderDashboard();
  await renderAdvice();
}

/** 渲染今日摄入列表 */
async function renderIntakeList() {
  const records = await getTodayRecords();
  const listEl = $('intake-list');
  const emptyEl = $('intake-empty');
  const countEl = $('intake-count');

  countEl.textContent = records.length + ' 项';

  if (records.length === 0) {
    emptyEl.style.display = 'flex';
    listEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.style.display = 'flex';

  listEl.innerHTML = records.map(r => `
    <li class="intake-item">
      <div class="intake-item-info">
        <div class="intake-item-name">${r.foodName}</div>
        <div class="intake-item-detail">${r.servingLabel} · ${r.time}</div>
      </div>
      <span class="intake-item-calories">${r.calories} kcal</span>
      <button class="intake-item-delete" data-id="${r.id}">🗑️</button>
    </li>
  `).join('');

  // 绑定删除事件
  listEl.querySelectorAll('.intake-item-delete').forEach(btn => {
    btn.addEventListener('click', () => removeIntakeRecord(btn.dataset.id));
  });
}

// ==================== 仪表盘更新 ====================
// 已迁移至 js/dashboard.js（Phase 4 增强版：营养素达标率 + 供能比例可视化）
// renderDashboard() 由 dashboard.js 提供，此处直接调用

// ==================== 建议引擎 ====================
// 已迁移至 js/advisor.js（Phase 5 增强版：5 维度分析 + 运动方案 + 食物推荐）
// renderAdvice() 由 advisor.js 提供，此处直接调用

// ==================== 事件绑定 ====================
function bindEvents() {
  // 日期导航
  $('btn-prev-day').addEventListener('click', goPrevDay);
  $('btn-next-day').addEventListener('click', goNextDay);

  // 设置按钮（openSettingsModal 是 async，作为事件处理器不需要 await）
  $('btn-settings').addEventListener('click', openSettingsModal);

  // 设置弹窗事件
  $('btn-settings-cancel').addEventListener('click', closeSettingsModal);
  $('btn-settings-save').addEventListener('click', async () => {
    await saveSettingsFromModal();
    showToast('设置已保存', 'success');
  });
  $('settings-modal').addEventListener('click', (e) => {
    if (e.target === $('settings-modal')) closeSettingsModal();
  });

  // 底部导航
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 返回按钮
  $('btn-back').addEventListener('click', () => switchTab('dashboard'));

  // 搜索
  $('search-input').addEventListener('input', onSearchInput);
  $('search-input').addEventListener('focus', () => {
    if (state.searchQuery) {
      $('search-results').style.display = 'block';
    }
  });
  $('search-clear').addEventListener('click', clearSearch);

  // 点击搜索框外部关闭搜索结果
  document.addEventListener('click', (e) => {
    const searchSection = $('search-section');
    if (!searchSection.contains(e.target)) {
      $('search-results').style.display = 'none';
    }
  });

  // 份量弹窗
  $('btn-serving-cancel').addEventListener('click', hideServingModal);
  $('btn-serving-confirm').addEventListener('click', confirmAddFood);

  // 点击遮罩关闭弹窗
  $('serving-modal').addEventListener('click', (e) => {
    if (e.target === $('serving-modal')) {
      hideServingModal();
    }
  });

  // 自定义食物弹窗
  $('btn-add-custom').addEventListener('click', (e) => {
    e.preventDefault();
    $('search-results').style.display = 'none';
    openCustomFoodModal();
  });
  $('btn-cf-cancel').addEventListener('click', closeCustomFoodModal);
  $('btn-cf-close').addEventListener('click', closeCustomFoodModal);
  $('btn-cf-save').addEventListener('click', async () => {
    await saveCustomFood();
    // 如果弹窗已关闭（保存成功），显示提示
    if ($('custom-food-modal').style.display === 'none') {
      showToast('自定义食物已添加', 'success');
    }
  });
  $('custom-food-modal').addEventListener('click', (e) => {
    if (e.target === $('custom-food-modal')) closeCustomFoodModal();
  });

  // 登出按钮
  const btnLogout = $('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('确定要退出登录吗？未保存的设置将丢失。')) {
        await logoutUser();
        closeSettingsModal();
        showToast('已退出登录', 'info');
        // 返回登录界面
        showAuthScreen();
      }
    });
  }

  // AI 智能估计按钮
  const btnAiEstimate = $('btn-ai-estimate');
  if (btnAiEstimate) {
    btnAiEstimate.addEventListener('click', (e) => {
      e.preventDefault();
      $('search-results').style.display = 'none';
      openAIEstimateModal();
    });
  }

  // AI 估计弹窗事件
  $('btn-ai-cancel').addEventListener('click', closeAIEstimateModal);
  $('btn-ai-close').addEventListener('click', closeAIEstimateModal);
  $('btn-ai-submit').addEventListener('click', submitAIEstimate);
  $('btn-ai-confirm').addEventListener('click', confirmAIEstimate);
  $('ai-estimate-modal').addEventListener('click', (e) => {
    if (e.target === $('ai-estimate-modal')) closeAIEstimateModal();
  });

  // AI 估计输入框字符计数
  $('ai-estimate-input').addEventListener('input', () => {
    const len = $('ai-estimate-input').value.length;
    $('ai-char-count').textContent = len;
  });
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', () => {
  bindAuthEvents();
  init();
});
