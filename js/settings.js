/**
 * 热量计算器 — 用户设置模块
 * Phase 7: 体重目标 / 个人信息 / 自定义热量目标
 *
 * 功能：
 *   1. BMR 基础代谢率计算（Mifflin-St Jeor 公式）
 *   2. 根据体重目标自动调整每日推荐热量
 *   3. 支持手动自定义热量目标
 *   4. 设置持久化到 localStorage（键名 cc_settings）
 *   5. 提供全局 getCalorieTarget() 供其他模块调用
 */

'use strict';

// ==================== 默认设置 ====================

const DEFAULT_SETTINGS = {
  goal: 'maintain',          // 'lose' | 'maintain' | 'gain'
  gender: 'male',            // 'male' | 'female'
  age: 25,
  weight: 70,                // kg
  height: 170,               // cm
  customCalorieTarget: null, // null = 自动计算，数字 = 手动指定
};

// ==================== 设置读写 ====================

/** 读取用户设置（合并默认值） */
function loadSettings() {
  try {
    const raw = localStorage.getItem(storageKey('cc_settings'));
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...saved };
    }
  } catch (e) {
    // 数据损坏，使用默认值
  }
  return { ...DEFAULT_SETTINGS };
}

/** 保存用户设置 */
function saveSettings(settings) {
  localStorage.setItem(storageKey('cc_settings'), JSON.stringify(settings));
}

// ==================== BMR / TDEE 计算 ====================

/**
 * Mifflin-St Jeor 公式计算基础代谢率（BMR）
 * @param {string} gender — 'male' | 'female'
 * @param {number} weight — 体重 kg
 * @param {number} height — 身高 cm
 * @param {number} age    — 年龄
 * @returns {number} BMR（kcal/天）
 */
function calcBMR(gender, weight, height, age) {
  if (gender === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

/**
 * 根据体重目标调整热量
 * @param {number} tdee — 维持体重所需热量
 * @param {string} goal — 'lose' | 'maintain' | 'gain'
 * @returns {number} 调整后的每日热量目标
 */
function adjustByGoal(tdee, goal) {
  switch (goal) {
    case 'lose':
      return Math.max(1200, tdee - 400); // 减重：-400 kcal，不低于 1200
    case 'gain':
      return tdee + 400;                  // 增重：+400 kcal
    default:
      return tdee;                        // 保持：不变
  }
}

/**
 * 计算推荐每日热量目标
 * BMR × 活动系数(1.2 久坐) → TDEE → 按目标调整
 */
function calcRecommendedTarget(settings) {
  const bmr = calcBMR(settings.gender, settings.weight, settings.height, settings.age);
  const tdee = Math.round(bmr * 1.2); // 久坐/轻体力活动
  return Math.round(adjustByGoal(tdee, settings.goal));
}

// ==================== 全局接口 ====================

/**
 * 获取当前生效的每日热量目标
 * 供 dashboard.js / advisor.js / history.js 调用
 * @returns {number}
 */
function getCalorieTarget() {
  const settings = loadSettings();
  if (settings.customCalorieTarget) {
    return settings.customCalorieTarget;
  }
  return calcRecommendedTarget(settings);
}

/**
 * 获取完整的用户设置
 * @returns {object}
 */
function getUserSettings() {
  return loadSettings();
}

// ==================== 设置弹窗交互 ====================

/** 当前编辑中的临时设置（打开弹窗时从 localStorage 加载） */
let editingSettings = null;

/** 打开设置弹窗 */
function openSettingsModal() {
  editingSettings = loadSettings();

  // 锁定背景页面滚动
  document.body.style.overflow = 'hidden';

  // 显示当前登录用户信息
  const user = getCurrentUser();
  const authSection = $('settings-auth');
  if (user && authSection) {
    authSection.style.display = 'flex';
    $('settings-auth-username').textContent = user.username;
  } else if (authSection) {
    authSection.style.display = 'none';
  }

  // 加载当前激活供应商的 API Key（在 bindApiKeyEvents 中统一处理）
  updateApiStatusBadge();

  // 目标分段按钮
  setSegActive('seg-goal', editingSettings.goal);
  // 性别分段按钮
  setSegActive('seg-gender', editingSettings.gender);

  // 基本信息
  $('set-age').value = editingSettings.age;
  $('set-weight').value = editingSettings.weight;
  $('set-height').value = editingSettings.height;

  // 自定义热量开关
  const isCustom = editingSettings.customCalorieTarget !== null;
  $('toggle-custom-calorie').checked = isCustom;
  $('custom-calorie-wrap').style.display = isCustom ? 'flex' : 'none';
  $('badge-auto').style.display = isCustom ? 'none' : 'inline';
  if (isCustom) {
    $('set-custom-calorie').value = editingSettings.customCalorieTarget;
  }

  // 更新显示的热量值
  refreshSettingsCalorieDisplay();

  // 绑定分段按钮事件
  bindSegEvents('seg-goal', (goal) => {
    editingSettings.goal = goal;
    if (!editingSettings.customCalorieTarget) refreshSettingsCalorieDisplay();
  });
  bindSegEvents('seg-gender', (gender) => {
    editingSettings.gender = gender;
    if (!editingSettings.customCalorieTarget) refreshSettingsCalorieDisplay();
  });

  // 基本信息输入 → 实时更新热量
  ['set-age', 'set-weight', 'set-height'].forEach(id => {
    $(id).addEventListener('input', () => {
      editingSettings.age    = parseInt($('set-age').value)    || DEFAULT_SETTINGS.age;
      editingSettings.weight = parseFloat($('set-weight').value) || DEFAULT_SETTINGS.weight;
      editingSettings.height = parseInt($('set-height').value) || DEFAULT_SETTINGS.height;
      if (!editingSettings.customCalorieTarget) refreshSettingsCalorieDisplay();
    });
  });

  // 自定义热量开关
  $('toggle-custom-calorie').addEventListener('change', () => {
    const on = $('toggle-custom-calorie').checked;
    $('custom-calorie-wrap').style.display = on ? 'flex' : 'none';
    $('badge-auto').style.display = on ? 'none' : 'inline';
    if (on) {
      $('set-custom-calorie').value = getCalorieTarget();
      $('settings-calorie-display').textContent = $('set-custom-calorie').value;
      $('badge-auto').textContent = '手动设置';
      $('badge-auto').style.background = 'var(--color-warning-light)';
      $('badge-auto').style.color = '#E65100';
    } else {
      $('badge-auto').textContent = '自动计算';
      $('badge-auto').style.background = 'var(--color-primary-light)';
      $('badge-auto').style.color = 'var(--color-primary-dark)';
      refreshSettingsCalorieDisplay();
    }
  });

  // 自定义热量输入
  $('set-custom-calorie').addEventListener('input', () => {
    $('settings-calorie-display').textContent = $('set-custom-calorie').value || '--';
  });

  // API Key 事件
  bindApiKeyEvents();

  // 关闭按钮
  const btnClose = $('btn-settings-close');
  if (btnClose) {
    const newClose = btnClose.cloneNode(true);
    btnClose.parentNode.replaceChild(newClose, btnClose);
    newClose.addEventListener('click', closeSettingsModal);
  }

  $('settings-modal').style.display = 'flex';
}

/** 关闭弹窗的通用清理 */
function dismissModal(modalId) {
  $(modalId).style.display = 'none';
  document.body.style.overflow = '';
}

/** 关闭设置弹窗（不保存） */
function closeSettingsModal() {
  editingSettings = null;
  dismissModal('settings-modal');
}

/** 保存设置 */
function saveSettingsFromModal() {
  if (!editingSettings) return;

  // 读取表单最新值
  editingSettings.age    = parseInt($('set-age').value)    || DEFAULT_SETTINGS.age;
  editingSettings.weight = parseFloat($('set-weight').value) || DEFAULT_SETTINGS.weight;
  editingSettings.height = parseInt($('set-height').value) || DEFAULT_SETTINGS.height;

  if ($('toggle-custom-calorie').checked) {
    editingSettings.customCalorieTarget = parseInt($('set-custom-calorie').value) || getCalorieTarget();
  } else {
    editingSettings.customCalorieTarget = null;
  }

  saveSettings(editingSettings);
  closeSettingsModal();

  // 设置变更后刷新所有视图（热量目标可能变了）
  refreshView();
}

// ==================== AI 配置管理 ====================

/** AI 配置事件绑定（每次打开设置弹窗时调用） */
function bindApiKeyEvents() {
  // 加载模型输入框
  const modelInput = $('set-api-model');
  if (modelInput) {
    modelInput.placeholder = AI_PROVIDER.defaultModel;
    const savedModel = getApiModel();
    modelInput.value = savedModel !== AI_PROVIDER.defaultModel ? savedModel : '';
  }

  // 加载 API Key
  const apiInput = $('set-api-key');
  if (apiInput) {
    apiInput.value = getApiKey() || '';
  }

  // 加载代理模式开关
  const proxyToggle = $('toggle-proxy-mode');
  const proxyPathWrap = $('settings-proxy-path-wrap');
  const proxyPathInput = $('set-proxy-path');
  const apiKeySection = $('settings-api-key-section');
  if (proxyToggle) {
    proxyToggle.checked = isProxyMode();
    if (apiKeySection) {
      apiKeySection.style.display = proxyToggle.checked ? 'none' : 'block';
    }
    if (proxyPathWrap) {
      proxyPathWrap.style.display = proxyToggle.checked ? 'block' : 'none';
    }
    if (proxyPathInput) {
      proxyPathInput.value = getProxyPath();
    }
  }

  // 代理模式开关事件
  if (proxyToggle) {
    const newProxyToggle = proxyToggle.cloneNode(true);
    proxyToggle.parentNode.replaceChild(newProxyToggle, proxyToggle);
    newProxyToggle.addEventListener('change', () => {
      const on = newProxyToggle.checked;
      if (apiKeySection) apiKeySection.style.display = on ? 'none' : 'block';
      if (proxyPathWrap) proxyPathWrap.style.display = on ? 'block' : 'none';
      updateApiStatusBadge();
    });
  }

  // 显示/隐藏 API Key
  const btnToggle = $('btn-api-toggle');
  if (btnToggle && apiInput) {
    const newBtn = btnToggle.cloneNode(true);
    btnToggle.parentNode.replaceChild(newBtn, btnToggle);
    newBtn.addEventListener('click', () => {
      const isPassword = apiInput.type === 'password';
      apiInput.type = isPassword ? 'text' : 'password';
      newBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  // 保存按钮
  const btnSave = $('btn-api-save');
  if (btnSave) {
    const newSave = btnSave.cloneNode(true);
    btnSave.parentNode.replaceChild(newSave, btnSave);
    newSave.addEventListener('click', () => {
      const key = $('set-api-key').value.trim();
      const model = $('set-api-model').value.trim();
      setApiKey(key);
      setApiModel(model);
      // 保存代理模式设置
      const proxyToggle = $('toggle-proxy-mode');
      const proxyPathInput = $('set-proxy-path');
      if (proxyToggle) {
        setProxyMode(proxyToggle.checked);
      }
      if (proxyPathInput) {
        setProxyPath(proxyPathInput.value.trim());
      }
      updateApiStatusBadge();
      const msg = proxyToggle && proxyToggle.checked
        ? '代理模式已启用（密钥由代理端管理）'
        : (key ? 'API 配置已保存' : 'API Key 已清除');
      showToast(msg, 'success');
    });
  }

  // 测试连接
  const btnTest = $('btn-api-test');
  if (btnTest) {
    const newTest = btnTest.cloneNode(true);
    btnTest.parentNode.replaceChild(newTest, btnTest);
    newTest.addEventListener('click', async () => {
      const key = $('set-api-key').value.trim();
      const proxyToggle = $('toggle-proxy-mode');
      const isProxy = proxyToggle && proxyToggle.checked;
      if (!isProxy && !key) {
        showToast('请先输入 API Key 或启用代理模式', 'warning');
        return;
      }
      // 先保存当前配置再测试
      setApiKey(key);
      setApiModel($('set-api-model').value.trim());
      if (proxyToggle) setProxyMode(proxyToggle.checked);
      const proxyPathInput = $('set-proxy-path');
      if (proxyPathInput) setProxyPath(proxyPathInput.value.trim());
      updateApiStatusBadge();

      newTest.disabled = true;
      newTest.textContent = '测试中...';
      const result = await testApiConnection();
      newTest.disabled = false;
      newTest.textContent = '测试连接';

      const badge = $('badge-api-status');
      if (result.success) {
        showToast('✅ 连接成功', 'success');
        if (badge) {
          badge.textContent = '已连接';
          badge.style.background = 'var(--color-primary-light)';
          badge.style.color = 'var(--color-primary-dark)';
        }
      } else {
        showToast('❌ ' + result.error, 'warning');
        if (badge) {
          badge.textContent = '连接失败';
          badge.style.background = 'var(--color-danger-light)';
          badge.style.color = 'var(--color-danger)';
        }
      }
    });
  }

  // 更新帮助链接
  const hintEl = $('api-hint-text');
  if (hintEl) {
    hintEl.innerHTML = `前往 <a href="${AI_PROVIDER.docsUrl}" target="_blank" rel="noopener">${AI_PROVIDER.docsUrl}</a> 注册并获取 API Key`;
  }

  // 更新状态标签
  updateApiStatusBadge();
}

/** 更新 API 状态标签 */
function updateApiStatusBadge() {
  const badge = $('badge-api-status');
  if (!badge) return;
  if (isProxyMode() && !getApiKey()) {
    badge.textContent = '默认密钥';
    badge.style.background = 'var(--color-primary-light)';
    badge.style.color = 'var(--color-primary-dark)';
  } else if (isProxyMode()) {
    badge.textContent = '代理模式';
    badge.style.background = '#E3F2FD';
    badge.style.color = '#1565C0';
  } else if (getApiKey()) {
    badge.textContent = '已配置';
    badge.style.background = 'var(--color-primary-light)';
    badge.style.color = 'var(--color-primary-dark)';
  } else {
    badge.textContent = '未配置';
    badge.style.background = 'var(--color-warning-light)';
    badge.style.color = '#E65100';
  }
}

// ==================== 弹窗内部工具 ====================

function setSegActive(containerId, activeValue) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.seg-btn').forEach(btn => {
    const val = btn.dataset.goal || btn.dataset.gender;
    btn.classList.toggle('seg-btn--active', val === activeValue);
  });
}

function bindSegEvents(containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('seg-btn--active'));
      btn.classList.add('seg-btn--active');
      const val = btn.dataset.goal || btn.dataset.gender;
      callback(val);
    });
  });
}

function refreshSettingsCalorieDisplay() {
  if (!editingSettings) return;
  const target = calcRecommendedTarget(editingSettings);
  $('settings-calorie-display').textContent = target;
}
