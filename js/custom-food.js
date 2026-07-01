/**
 * 热量计算器 — 自定义食物模块
 * Phase 8: 用户可添加、搜索、删除自定义食物
 *
 * 功能：
 *   1. 自定义食物添加（名称 + 热量 + 可选营养素）
 *   2. 持久化到 localStorage（键名 cc_custom_foods）
 *   3. 融合到全局搜索中（searchCustomFoods）
 *   4. 支持按 ID 查询（getCustomFoodById）
 *   5. 支持删除（deleteCustomFood）
 */

'use strict';

const CUSTOM_FOODS_KEY = 'cc_custom_foods';

// ==================== 数据读写 ====================

/** 获取所有自定义食物 */
function getCustomFoods() {
  try {
    return JSON.parse(localStorage.getItem(storageKey(CUSTOM_FOODS_KEY))) || [];
  } catch (e) {
    return [];
  }
}

/** 保存自定义食物列表 */
function saveCustomFoods(foods) {
  localStorage.setItem(storageKey(CUSTOM_FOODS_KEY), JSON.stringify(foods));
}

// ==================== CRUD ====================

/**
 * 添加一个自定义食物
 * @param {{ name: string, cal: number, carbs?: number, protein?: number, fat?: number }} data
 * @returns {object} 创建的食物对象
 */
function addCustomFood(data) {
  const food = {
    id: 'custom_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    name: data.name.trim(),
    category: 'custom',
    cal: Math.round(data.cal),
    carbs: Math.round((data.carbs || 0) * 10) / 10,
    protein: Math.round((data.protein || 0) * 10) / 10,
    fat: Math.round((data.fat || 0) * 10) / 10,
    servings: [
      { label: '100g', g: 100 },
      { label: '50g', g: 50 },
      { label: '200g', g: 200 },
    ],
  };

  const foods = getCustomFoods();
  foods.push(food);
  saveCustomFoods(foods);

  return food;
}

/**
 * 删除一个自定义食物
 * @param {string} id
 * @returns {boolean} 是否删除成功
 */
function deleteCustomFood(id) {
  const foods = getCustomFoods();
  const idx = foods.findIndex(f => f.id === id);
  if (idx === -1) return false;
  foods.splice(idx, 1);
  saveCustomFoods(foods);
  return true;
}

// ==================== 查询接口 ====================

/**
 * 搜索自定义食物（与 searchFoods 接口一致）
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Array}
 */
function searchCustomFoods(query, limit) {
  limit = limit || 10;
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const foods = getCustomFoods();
  return foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, limit);
}

/**
 * 按 ID 查找自定义食物
 * @param {string} id
 * @returns {object|null}
 */
function getCustomFoodById(id) {
  if (!id || !id.startsWith('custom_')) return null;
  const foods = getCustomFoods();
  return foods.find(f => f.id === id) || null;
}

// ==================== 弹窗交互 ====================

/** 打开自定义食物添加弹窗 */
function openCustomFoodModal() {
  // 清空表单
  $('cf-name').value = '';
  $('cf-cal').value = '';
  $('cf-carbs').value = '';
  $('cf-protein').value = '';
  $('cf-fat').value = '';

  $('custom-food-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  $('cf-name').focus();
}

/** 关闭自定义食物弹窗 */
function closeCustomFoodModal() {
  $('custom-food-modal').style.display = 'none';
  document.body.style.overflow = '';
}

/** 保存自定义食物 */
function saveCustomFood() {
  const name = $('cf-name').value.trim();
  const cal  = parseInt($('cf-cal').value);

  // 校验必填项
  if (!name) {
    alert('请输入食物名称');
    $('cf-name').focus();
    return;
  }
  if (!cal || cal <= 0) {
    alert('请输入有效的热量值（kcal/100g）');
    $('cf-cal').focus();
    return;
  }

  // 添加食物
  const food = addCustomFood({
    name: name,
    cal: cal,
    carbs: parseFloat($('cf-carbs').value) || 0,
    protein: parseFloat($('cf-protein').value) || 0,
    fat: parseFloat($('cf-fat').value) || 0,
  });

  closeCustomFoodModal();

  // 自动搜索新添加的食物，让用户看到结果
  const input = $('search-input');
  input.value = food.name;
  state.searchQuery = food.name;
  $('search-clear').style.display = 'flex';
  // 触发搜索刷新
  if (state.searchQuery) {
    const results = searchFoods(state.searchQuery);
    renderSearchResults(results);
    $('search-results').style.display = 'block';
  }
}
