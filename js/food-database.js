/**
 * 热量计算器 — 内置食物数据库
 * Phase 2: 中餐常见食物热量与营养素数据
 *
 * 数据来源参考《中国食物成分表》标准版
 * 热量单位：kcal/100g，营养素单位：g/100g
 */

'use strict';

// ==================== 食物分类 ====================
const CATEGORIES = {
  staple:   { id: 'staple',   name: '主食',   icon: '🍚' },
  meat:     { id: 'meat',     name: '肉类',   icon: '🥩' },
  vegetable:{ id: 'vegetable',name: '蔬菜',   icon: '🥬' },
  fruit:    { id: 'fruit',    name: '水果',   icon: '🍎' },
  egg_dairy:{ id: 'egg_dairy',name: '蛋奶',   icon: '🥛' },
  soy:      { id: 'soy',      name: '豆制品', icon: '🫘' },
  snack:    { id: 'snack',    name: '零食饮品',icon: '🍪' },
  dish:     { id: 'dish',     name: '中式菜品',icon: '🍳' },
  custom:   { id: 'custom',   name: '自定义', icon: '✏️' },
};

// ==================== 食物数据 ====================
const FOOD_DATABASE = [
  // ========== 主食类 ==========
  { id: 's01', category: 'staple', name: '米饭（熟）',        cal: 116,  carbs: 25.9, protein: 2.6,  fat: 0.3,  servings: [{ label: '1小碗', g: 150 }, { label: '1大碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 's02', category: 'staple', name: '白粥',              cal: 46,   carbs: 9.7,  protein: 1.1,  fat: 0.2,  servings: [{ label: '1小碗', g: 250 }, { label: '1大碗', g: 400 }, { label: '100g', g: 100 }] },
  { id: 's03', category: 'staple', name: '馒头',              cal: 223,  carbs: 44.2, protein: 7.0,  fat: 1.1,  servings: [{ label: '1个(小)', g: 80 }, { label: '1个(大)', g: 120 }, { label: '100g', g: 100 }] },
  { id: 's04', category: 'staple', name: '花卷',              cal: 211,  carbs: 45.6, protein: 6.4,  fat: 1.5,  servings: [{ label: '1个', g: 90 }, { label: '100g', g: 100 }] },
  { id: 's05', category: 'staple', name: '包子（猪肉）',      cal: 227,  carbs: 30.6, protein: 7.3,  fat: 7.5,  servings: [{ label: '1个(小)', g: 60 }, { label: '1个(大)', g: 100 }, { label: '100g', g: 100 }] },
  { id: 's06', category: 'staple', name: '饺子（猪肉白菜）',  cal: 218,  carbs: 26.4, protein: 7.8,  fat: 8.0,  servings: [{ label: '1个', g: 20 }, { label: '10个', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's07', category: 'staple', name: '馄饨',              cal: 181,  carbs: 25.0, protein: 6.0,  fat: 5.5,  servings: [{ label: '1碗(10个)', g: 250 }, { label: '100g', g: 100 }] },
  { id: 's08', category: 'staple', name: '面条（煮）',        cal: 110,  carbs: 22.0, protein: 3.5,  fat: 0.6,  servings: [{ label: '1小碗', g: 250 }, { label: '1大碗', g: 400 }, { label: '100g', g: 100 }] },
  { id: 's09', category: 'staple', name: '方便面',            cal: 473,  carbs: 60.3, protein: 9.5,  fat: 20.0, servings: [{ label: '1包', g: 100 }, { label: '100g', g: 100 }] },
  { id: 's10', category: 'staple', name: '油条',              cal: 386,  carbs: 51.0, protein: 6.9,  fat: 17.6, servings: [{ label: '1根', g: 70 }, { label: '100g', g: 100 }] },
  { id: 's11', category: 'staple', name: '小米粥',            cal: 46,   carbs: 8.4,  protein: 1.4,  fat: 0.7,  servings: [{ label: '1碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 's12', category: 'staple', name: '全麦面包',          cal: 246,  carbs: 43.0, protein: 10.0, fat: 3.4,  servings: [{ label: '1片', g: 40 }, { label: '2片', g: 80 }, { label: '100g', g: 100 }] },
  { id: 's13', category: 'staple', name: '白面包',            cal: 267,  carbs: 49.0, protein: 8.0,  fat: 3.5,  servings: [{ label: '1片', g: 40 }, { label: '2片', g: 80 }, { label: '100g', g: 100 }] },
  { id: 's14', category: 'staple', name: '红薯（烤）',        cal: 99,   carbs: 23.1, protein: 1.6,  fat: 0.2,  servings: [{ label: '1个(中)', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's15', category: 'staple', name: '玉米（煮）',        cal: 112,  carbs: 22.8, protein: 4.0,  fat: 1.2,  servings: [{ label: '1根', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's16', category: 'staple', name: '燕麦片',            cal: 377,  carbs: 66.3, protein: 13.5, fat: 6.7,  servings: [{ label: '1碗(50g)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 's17', category: 'staple', name: '饼干（苏打）',      cal: 408,  carbs: 76.0, protein: 8.4,  fat: 7.7,  servings: [{ label: '1包', g: 100 }, { label: '3片', g: 30 }, { label: '100g', g: 100 }] },
  { id: 's18', category: 'staple', name: '年糕',              cal: 156,  carbs: 34.7, protein: 3.3,  fat: 0.6,  servings: [{ label: '1碗', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's19', category: 'staple', name: '烧饼',              cal: 326,  carbs: 52.3, protein: 8.2,  fat: 9.5,  servings: [{ label: '1个', g: 100 }, { label: '100g', g: 100 }] },
  { id: 's20', category: 'staple', name: '紫薯',              cal: 106,  carbs: 24.2, protein: 1.7,  fat: 0.2,  servings: [{ label: '1个(中)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 's21', category: 'staple', name: '杂粮饭',            cal: 120,  carbs: 25.0, protein: 3.0,  fat: 0.5,  servings: [{ label: '1小碗', g: 150 }, { label: '1大碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 's22', category: 'staple', name: '炒面',              cal: 178,  carbs: 28.0, protein: 5.0,  fat: 5.5,  servings: [{ label: '1盘', g: 350 }, { label: '100g', g: 100 }] },
  { id: 's23', category: 'staple', name: '炒河粉',            cal: 165,  carbs: 26.0, protein: 4.0,  fat: 5.0,  servings: [{ label: '1盘', g: 350 }, { label: '100g', g: 100 }] },
  { id: 's24', category: 'staple', name: '凉皮',              cal: 117,  carbs: 22.0, protein: 3.5,  fat: 2.0,  servings: [{ label: '1碗', g: 350 }, { label: '100g', g: 100 }] },
  { id: 's25', category: 'staple', name: '米粉（煮）',        cal: 98,   carbs: 21.0, protein: 2.0,  fat: 0.4,  servings: [{ label: '1碗', g: 350 }, { label: '100g', g: 100 }] },
  { id: 's26', category: 'staple', name: '肠粉',              cal: 110,  carbs: 20.0, protein: 3.0,  fat: 2.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 's27', category: 'staple', name: '粽子（肉粽）',      cal: 195,  carbs: 28.0, protein: 5.0,  fat: 6.5,  servings: [{ label: '1个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 's28', category: 'staple', name: '汤圆（芝麻）',      cal: 231,  carbs: 38.0, protein: 4.0,  fat: 7.0,  servings: [{ label: '5个', g: 100 }, { label: '10个', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's29', category: 'staple', name: '煎饼果子',          cal: 185,  carbs: 30.0, protein: 5.0,  fat: 5.0,  servings: [{ label: '1个', g: 200 }, { label: '100g', g: 100 }] },
  { id: 's30', category: 'staple', name: '葱油饼',            cal: 280,  carbs: 35.0, protein: 6.0,  fat: 12.0, servings: [{ label: '1张', g: 120 }, { label: '100g', g: 100 }] },
  { id: 's31', category: 'staple', name: '肉夹馍',            cal: 228,  carbs: 30.0, protein: 9.0,  fat: 7.5,  servings: [{ label: '1个', g: 180 }, { label: '100g', g: 100 }] },
  { id: 's32', category: 'staple', name: '小笼包',            cal: 210,  carbs: 25.0, protein: 8.5,  fat: 8.0,  servings: [{ label: '1笼(8个)', g: 250 }, { label: '4个', g: 125 }, { label: '100g', g: 100 }] },
  { id: 's33', category: 'staple', name: '烧卖（糯米）',      cal: 220,  carbs: 35.0, protein: 6.0,  fat: 6.0,  servings: [{ label: '4个', g: 120 }, { label: '100g', g: 100 }] },
  { id: 's34', category: 'staple', name: '馒头（全麦）',      cal: 210,  carbs: 41.0, protein: 8.0,  fat: 1.0,  servings: [{ label: '1个', g: 100 }, { label: '100g', g: 100 }] },
  { id: 's35', category: 'staple', name: '窝窝头',            cal: 233,  carbs: 47.0, protein: 7.0,  fat: 2.5,  servings: [{ label: '1个', g: 80 }, { label: '100g', g: 100 }] },
  { id: 's36', category: 'staple', name: '八宝粥',            cal: 65,   carbs: 14.0, protein: 1.5,  fat: 0.3,  servings: [{ label: '1罐(360g)', g: 360 }, { label: '1碗', g: 300 }, { label: '100g', g: 100 }] },

  // ========== 肉类 ==========
  { id: 'm01', category: 'meat', name: '猪肉（五花）',  cal: 395, carbs: 2.4,  protein: 13.2, fat: 37.0, servings: [{ label: '100g', g: 100 }] },
  { id: 'm02', category: 'meat', name: '猪肉（瘦肉）',  cal: 143, carbs: 1.5,  protein: 20.3, fat: 6.2,  servings: [{ label: '100g', g: 100 }] },
  { id: 'm03', category: 'meat', name: '猪排骨',        cal: 264, carbs: 0.0,  protein: 18.3, fat: 20.4, servings: [{ label: '100g', g: 100 }] },
  { id: 'm04', category: 'meat', name: '猪肝',          cal: 129, carbs: 5.0,  protein: 19.3, fat: 3.5,  servings: [{ label: '100g', g: 100 }] },
  { id: 'm05', category: 'meat', name: '鸡胸肉',        cal: 133, carbs: 2.5,  protein: 19.4, fat: 5.0,  servings: [{ label: '1块(中)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm06', category: 'meat', name: '鸡腿肉',        cal: 181, carbs: 0.0,  protein: 16.4, fat: 13.0, servings: [{ label: '1个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm07', category: 'meat', name: '鸡翅',          cal: 194, carbs: 4.6,  protein: 18.3, fat: 11.8, servings: [{ label: '1个', g: 50 }, { label: '5个', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'm08', category: 'meat', name: '鸡蛋（煮）',    cal: 144, carbs: 2.8,  protein: 13.3, fat: 8.8,  servings: [{ label: '1个', g: 55 }, { label: '2个', g: 110 }, { label: '100g', g: 100 }] },
  { id: 'm09', category: 'meat', name: '鸡蛋（炒）',    cal: 196, carbs: 1.8,  protein: 12.0, fat: 15.0, servings: [{ label: '1份(2个蛋)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm10', category: 'meat', name: '鸭肉',          cal: 240, carbs: 0.1,  protein: 15.5, fat: 19.7, servings: [{ label: '100g', g: 100 }] },
  { id: 'm11', category: 'meat', name: '牛肉（瘦）',    cal: 125, carbs: 1.2,  protein: 20.2, fat: 4.2,  servings: [{ label: '100g', g: 100 }, { label: '1牛排', g: 200 }] },
  { id: 'm12', category: 'meat', name: '牛肉（肥牛）',  cal: 250, carbs: 0.1,  protein: 18.0, fat: 19.0, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm13', category: 'meat', name: '羊肉',          cal: 203, carbs: 0.0,  protein: 19.0, fat: 14.1, servings: [{ label: '100g', g: 100 }] },
  { id: 'm14', category: 'meat', name: '鱼肉（草鱼）',  cal: 113, carbs: 0.0,  protein: 16.6, fat: 5.2,  servings: [{ label: '1条(中)', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'm15', category: 'meat', name: '三文鱼',        cal: 208, carbs: 0.0,  protein: 20.4, fat: 13.4, servings: [{ label: '1块', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm16', category: 'meat', name: '虾仁',          cal: 99,  carbs: 0.2,  protein: 20.4, fat: 0.7,  servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm17', category: 'meat', name: '带鱼',          cal: 127, carbs: 0.0,  protein: 17.7, fat: 4.9,  servings: [{ label: '1条', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm18', category: 'meat', name: '螃蟹',          cal: 95,  carbs: 2.3,  protein: 13.8, fat: 2.3,  servings: [{ label: '1只(中)', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm19', category: 'meat', name: '香肠',          cal: 508, carbs: 10.0, protein: 14.0, fat: 48.0, servings: [{ label: '1根', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'm20', category: 'meat', name: '培根',          cal: 541, carbs: 1.4,  protein: 12.0, fat: 55.0, servings: [{ label: '2片', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'm21', category: 'meat', name: '猪蹄',          cal: 260, carbs: 0.0,  protein: 22.0, fat: 19.0, servings: [{ label: '1只', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'm22', category: 'meat', name: '猪耳朵',        cal: 210, carbs: 0.5,  protein: 17.0, fat: 15.0, servings: [{ label: '1个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm23', category: 'meat', name: '猪肚',          cal: 110, carbs: 0.7,  protein: 15.6, fat: 5.1,  servings: [{ label: '100g', g: 100 }] },
  { id: 'm24', category: 'meat', name: '腊肉',          cal: 498, carbs: 11.0, protein: 18.0, fat: 42.0, servings: [{ label: '1块(50g)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'm25', category: 'meat', name: '牛腱',          cal: 123, carbs: 1.0,  protein: 21.0, fat: 4.0,  servings: [{ label: '100g', g: 100 }] },
  { id: 'm26', category: 'meat', name: '牛百叶/毛肚',   cal: 70,  carbs: 0.2,  protein: 13.0, fat: 1.5,  servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm27', category: 'meat', name: '羊排',          cal: 250, carbs: 0.0,  protein: 17.0, fat: 20.0, servings: [{ label: '1根', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm28', category: 'meat', name: '鸡胗',          cal: 94,  carbs: 0.6,  protein: 17.9, fat: 1.8,  servings: [{ label: '1份', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm29', category: 'meat', name: '鸡肝',          cal: 121, carbs: 2.5,  protein: 16.6, fat: 4.8,  servings: [{ label: '100g', g: 100 }] },
  { id: 'm30', category: 'meat', name: '鸭血',          cal: 58,  carbs: 0.9,  protein: 12.0, fat: 0.4,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm31', category: 'meat', name: '鱿鱼',          cal: 75,  carbs: 0.8,  protein: 15.0, fat: 0.8,  servings: [{ label: '1条', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm32', category: 'meat', name: '龙虾',          cal: 90,  carbs: 0.5,  protein: 18.9, fat: 1.1,  servings: [{ label: '1只(中)', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'm33', category: 'meat', name: '蛤蜊',          cal: 62,  carbs: 2.0,  protein: 10.0, fat: 1.1,  servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'm34', category: 'meat', name: '扇贝',          cal: 77,  carbs: 2.5,  protein: 13.0, fat: 1.0,  servings: [{ label: '6只', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'm35', category: 'meat', name: '牛蛙',          cal: 87,  carbs: 0.0,  protein: 16.4, fat: 1.8,  servings: [{ label: '1只', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm36', category: 'meat', name: '黄鳝',          cal: 122, carbs: 0.5,  protein: 18.0, fat: 5.0,  servings: [{ label: '1条', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'm37', category: 'meat', name: '鸽子',          cal: 201, carbs: 0.2,  protein: 16.5, fat: 14.2, servings: [{ label: '1只', g: 350 }, { label: '100g', g: 100 }] },
  { id: 'm38', category: 'meat', name: '鹅肉',          cal: 251, carbs: 0.0,  protein: 17.9, fat: 19.9, servings: [{ label: '100g', g: 100 }] },

  // ========== 蔬菜类 ==========
  { id: 'v01', category: 'vegetable', name: '番茄',         cal: 19,  carbs: 3.5, protein: 0.9, fat: 0.2, servings: [{ label: '1个(中)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'v02', category: 'vegetable', name: '黄瓜',         cal: 15,  carbs: 2.5, protein: 0.8, fat: 0.2, servings: [{ label: '1根', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v03', category: 'vegetable', name: '白菜',         cal: 13,  carbs: 2.1, protein: 1.4, fat: 0.1, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v04', category: 'vegetable', name: '菠菜',         cal: 22,  carbs: 2.8, protein: 2.6, fat: 0.4, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v05', category: 'vegetable', name: '西兰花',       cal: 33,  carbs: 4.3, protein: 4.1, fat: 0.6, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v06', category: 'vegetable', name: '生菜',         cal: 15,  carbs: 2.0, protein: 1.3, fat: 0.3, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v07', category: 'vegetable', name: '土豆',         cal: 76,  carbs: 17.2,protein: 2.0, fat: 0.2, servings: [{ label: '1个(中)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'v08', category: 'vegetable', name: '胡萝卜',       cal: 37,  carbs: 8.8, protein: 1.0, fat: 0.2, servings: [{ label: '1根', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'v09', category: 'vegetable', name: '白萝卜',       cal: 16,  carbs: 3.0, protein: 0.7, fat: 0.1, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v10', category: 'vegetable', name: '洋葱',         cal: 39,  carbs: 9.0, protein: 1.1, fat: 0.1, servings: [{ label: '1个(中)', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'v11', category: 'vegetable', name: '茄子',         cal: 21,  carbs: 4.0, protein: 1.1, fat: 0.2, servings: [{ label: '1根', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v12', category: 'vegetable', name: '青椒',         cal: 20,  carbs: 4.0, protein: 1.0, fat: 0.2, servings: [{ label: '1个', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'v13', category: 'vegetable', name: '冬瓜',         cal: 11,  carbs: 1.9, protein: 0.4, fat: 0.2, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v14', category: 'vegetable', name: '南瓜',         cal: 22,  carbs: 5.3, protein: 0.7, fat: 0.1, servings: [{ label: '1块', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v15', category: 'vegetable', name: '芹菜',         cal: 14,  carbs: 2.5, protein: 0.8, fat: 0.1, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v16', category: 'vegetable', name: '豆芽',         cal: 18,  carbs: 2.4, protein: 2.1, fat: 0.3, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v17', category: 'vegetable', name: '韭菜',         cal: 25,  carbs: 3.2, protein: 2.4, fat: 0.4, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v18', category: 'vegetable', name: '蘑菇',         cal: 20,  carbs: 2.0, protein: 2.7, fat: 0.3, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v19', category: 'vegetable', name: '木耳（干）',   cal: 205, carbs: 36.0,protein: 12.1, fat: 1.5, servings: [{ label: '10g(泡发后约100g)', g: 10 }, { label: '100g', g: 100 }] },
  { id: 'v20', category: 'vegetable', name: '海带',         cal: 38,  carbs: 6.7, protein: 1.1, fat: 0.1, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v21', category: 'vegetable', name: '油菜（上海青）',cal: 12,  carbs: 1.5, protein: 1.3, fat: 0.2, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v22', category: 'vegetable', name: '空心菜',       cal: 20,  carbs: 2.0, protein: 2.2, fat: 0.3, servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'v23', category: 'vegetable', name: '油麦菜',       cal: 15,  carbs: 1.5, protein: 1.5, fat: 0.4, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v24', category: 'vegetable', name: '莴笋',         cal: 14,  carbs: 2.2, protein: 1.0, fat: 0.1, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v25', category: 'vegetable', name: '莲藕',         cal: 70,  carbs: 15.2,protein: 2.0, fat: 0.2, servings: [{ label: '1节', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v26', category: 'vegetable', name: '山药',         cal: 56,  carbs: 11.6,protein: 1.9, fat: 0.2, servings: [{ label: '1段', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'v27', category: 'vegetable', name: '芋头',         cal: 79,  carbs: 17.1,protein: 2.2, fat: 0.2, servings: [{ label: '1个(小)', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'v28', category: 'vegetable', name: '竹笋',         cal: 19,  carbs: 2.5, protein: 2.6, fat: 0.2, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v29', category: 'vegetable', name: '芦笋',         cal: 20,  carbs: 3.0, protein: 2.2, fat: 0.1, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v30', category: 'vegetable', name: '秋葵',         cal: 37,  carbs: 4.5, protein: 2.0, fat: 0.3, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v31', category: 'vegetable', name: '苦瓜',         cal: 19,  carbs: 3.5, protein: 1.0, fat: 0.1, servings: [{ label: '1根', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v32', category: 'vegetable', name: '丝瓜',         cal: 18,  carbs: 3.0, protein: 1.0, fat: 0.2, servings: [{ label: '1根', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v33', category: 'vegetable', name: '西葫芦',       cal: 17,  carbs: 3.0, protein: 1.2, fat: 0.2, servings: [{ label: '1个', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v34', category: 'vegetable', name: '荷兰豆',       cal: 34,  carbs: 4.5, protein: 2.5, fat: 0.3, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v35', category: 'vegetable', name: '蒜苗',         cal: 37,  carbs: 6.0, protein: 2.0, fat: 0.4, servings: [{ label: '1盘', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'v36', category: 'vegetable', name: '茼蒿',         cal: 21,  carbs: 2.5, protein: 1.9, fat: 0.3, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v37', category: 'vegetable', name: '芥蓝',         cal: 16,  carbs: 2.0, protein: 1.5, fat: 0.1, servings: [{ label: '1盘', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'v38', category: 'vegetable', name: '玉米粒',       cal: 106, carbs: 18.7,protein: 3.3, fat: 1.4, servings: [{ label: '1碗', g: 150 }, { label: '100g', g: 100 }] },

  // ========== 水果类 ==========
  { id: 'f01', category: 'fruit', name: '苹果',       cal: 52,  carbs: 13.5, protein: 0.2, fat: 0.2, servings: [{ label: '1个(中)', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f02', category: 'fruit', name: '香蕉',       cal: 91,  carbs: 20.1, protein: 1.4, fat: 0.2, servings: [{ label: '1根(中)', g: 120 }, { label: '100g', g: 100 }] },
  { id: 'f03', category: 'fruit', name: '橙子',       cal: 47,  carbs: 10.2, protein: 0.8, fat: 0.2, servings: [{ label: '1个(中)', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f04', category: 'fruit', name: '葡萄',       cal: 43,  carbs: 9.9,  protein: 0.5, fat: 0.2, servings: [{ label: '1串', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'f05', category: 'fruit', name: '西瓜',       cal: 31,  carbs: 6.8,  protein: 0.5, fat: 0.1, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'f06', category: 'fruit', name: '草莓',       cal: 30,  carbs: 6.0,  protein: 1.0, fat: 0.2, servings: [{ label: '10颗', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f07', category: 'fruit', name: '芒果',       cal: 60,  carbs: 13.7, protein: 0.6, fat: 0.4, servings: [{ label: '1个(中)', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'f08', category: 'fruit', name: '猕猴桃',     cal: 56,  carbs: 13.0, protein: 0.8, fat: 0.6, servings: [{ label: '1个', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'f09', category: 'fruit', name: '梨',         cal: 44,  carbs: 10.8, protein: 0.4, fat: 0.2, servings: [{ label: '1个(中)', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'f10', category: 'fruit', name: '桃子',       cal: 42,  carbs: 9.5,  protein: 0.9, fat: 0.1, servings: [{ label: '1个(中)', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f11', category: 'fruit', name: '樱桃',       cal: 50,  carbs: 10.2, protein: 1.0, fat: 0.3, servings: [{ label: '1碗', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f12', category: 'fruit', name: '柚子',       cal: 41,  carbs: 9.1,  protein: 0.8, fat: 0.2, servings: [{ label: '2瓣', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f13', category: 'fruit', name: '火龙果',     cal: 55,  carbs: 11.3, protein: 1.1, fat: 0.4, servings: [{ label: '半个', g: 200 }, { label: '1个', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'f14', category: 'fruit', name: '荔枝',       cal: 66,  carbs: 15.2, protein: 0.8, fat: 0.4, servings: [{ label: '10颗', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f15', category: 'fruit', name: '蓝莓',       cal: 57,  carbs: 14.0, protein: 0.7, fat: 0.3, servings: [{ label: '1盒', g: 125 }, { label: '100g', g: 100 }] },
  { id: 'f16', category: 'fruit', name: '榴莲',       cal: 147, carbs: 27.0, protein: 1.5, fat: 3.3, servings: [{ label: '2瓣', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f17', category: 'fruit', name: '菠萝',       cal: 41,  carbs: 9.5,  protein: 0.5, fat: 0.1, servings: [{ label: '1/4个', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f18', category: 'fruit', name: '木瓜',       cal: 39,  carbs: 9.0,  protein: 0.6, fat: 0.1, servings: [{ label: '半个', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'f19', category: 'fruit', name: '哈密瓜',     cal: 34,  carbs: 7.7,  protein: 0.8, fat: 0.1, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'f20', category: 'fruit', name: '石榴',       cal: 63,  carbs: 13.9, protein: 1.3, fat: 0.4, servings: [{ label: '半个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f21', category: 'fruit', name: '柿子',       cal: 71,  carbs: 17.1, protein: 0.7, fat: 0.1, servings: [{ label: '1个', g: 180 }, { label: '100g', g: 100 }] },
  { id: 'f22', category: 'fruit', name: '牛油果',     cal: 160, carbs: 8.5,  protein: 2.0, fat: 15.0, servings: [{ label: '半个', g: 80 }, { label: '1个', g: 160 }, { label: '100g', g: 100 }] },
  { id: 'f23', category: 'fruit', name: '山竹',       cal: 72,  carbs: 18.0, protein: 0.4, fat: 0.4, servings: [{ label: '5个', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'f24', category: 'fruit', name: '椰子肉',     cal: 241, carbs: 15.2, protein: 3.3, fat: 12.1, servings: [{ label: '半个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f25', category: 'fruit', name: '柠檬',       cal: 35,  carbs: 6.2,  protein: 1.1, fat: 0.3, servings: [{ label: '1个', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'f26', category: 'fruit', name: '百香果',     cal: 66,  carbs: 10.4, protein: 1.8, fat: 0.7, servings: [{ label: '2个', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'f27', category: 'fruit', name: '冬枣',       cal: 103, carbs: 23.2, protein: 1.2, fat: 0.3, servings: [{ label: '10颗', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f28', category: 'fruit', name: '无花果',     cal: 59,  carbs: 13.0, protein: 0.7, fat: 0.3, servings: [{ label: '3个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f29', category: 'fruit', name: '桑葚',       cal: 48,  carbs: 9.7,  protein: 1.7, fat: 0.4, servings: [{ label: '1盒', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'f30', category: 'fruit', name: '枇杷',       cal: 39,  carbs: 8.5,  protein: 0.8, fat: 0.2, servings: [{ label: '10颗', g: 200 }, { label: '100g', g: 100 }] },

  // ========== 蛋奶类 ==========
  { id: 'd01', category: 'egg_dairy', name: '牛奶（全脂）', cal: 65,  carbs: 5.0, protein: 3.2, fat: 3.6, servings: [{ label: '1杯(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'd02', category: 'egg_dairy', name: '牛奶（脱脂）', cal: 35,  carbs: 5.0, protein: 3.5, fat: 0.3, servings: [{ label: '1杯(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'd03', category: 'egg_dairy', name: '酸奶（原味）', cal: 72,  carbs: 10.0,protein: 3.5, fat: 2.0, servings: [{ label: '1杯', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'd04', category: 'egg_dairy', name: '奶酪',         cal: 350, carbs: 2.0, protein: 25.0, fat: 27.0, servings: [{ label: '1片', g: 20 }, { label: '100g', g: 100 }] },
  { id: 'd05', category: 'egg_dairy', name: '黄油',         cal: 717, carbs: 0.1, protein: 0.9, fat: 81.0, servings: [{ label: '1小块(10g)', g: 10 }, { label: '100g', g: 100 }] },
  { id: 'd06', category: 'egg_dairy', name: '冰淇淋',       cal: 207, carbs: 24.0,protein: 3.5, fat: 10.0, servings: [{ label: '1球', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'd07', category: 'egg_dairy', name: '咸鸭蛋',       cal: 190, carbs: 2.0, protein: 12.7, fat: 14.0, servings: [{ label: '1个', g: 65 }, { label: '100g', g: 100 }] },
  { id: 'd08', category: 'egg_dairy', name: '鹌鹑蛋（熟）', cal: 160, carbs: 1.1, protein: 12.8, fat: 11.1, servings: [{ label: '5个', g: 60 }, { label: '10个', g: 120 }, { label: '100g', g: 100 }] },
  { id: 'd09', category: 'egg_dairy', name: '皮蛋',         cal: 171, carbs: 2.6, protein: 14.2, fat: 11.0, servings: [{ label: '1个', g: 60 }, { label: '100g', g: 100 }] },
  { id: 'd10', category: 'egg_dairy', name: '希腊酸奶',     cal: 97,  carbs: 4.0, protein: 10.0, fat: 4.5,  servings: [{ label: '1杯', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'd11', category: 'egg_dairy', name: '炼乳',         cal: 331, carbs: 55.0,protein: 8.0, fat: 8.7,  servings: [{ label: '1勺(20g)', g: 20 }, { label: '100g', g: 100 }] },
  { id: 'd12', category: 'egg_dairy', name: '蛋挞',         cal: 298, carbs: 28.0,protein: 5.0, fat: 17.0, servings: [{ label: '1个', g: 60 }, { label: '100g', g: 100 }] },
  { id: 'd13', category: 'egg_dairy', name: '双皮奶',       cal: 85,  carbs: 13.0,protein: 3.5, fat: 2.0,  servings: [{ label: '1碗', g: 200 }, { label: '100g', g: 100 }] },

  // ========== 豆制品 ==========
  { id: 'y01', category: 'soy', name: '豆腐（嫩）',   cal: 62,  carbs: 2.6, protein: 5.0, fat: 3.5, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'y02', category: 'soy', name: '豆腐（老）',   cal: 81,  carbs: 3.8, protein: 8.1, fat: 3.7, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'y03', category: 'soy', name: '豆浆（无糖）', cal: 31,  carbs: 1.8, protein: 3.0, fat: 1.2, servings: [{ label: '1杯(300ml)', g: 300 }, { label: '100ml', g: 100 }] },
  { id: 'y04', category: 'soy', name: '腐竹（干）',   cal: 459, carbs: 16.0,protein: 44.6, fat: 26.0,servings: [{ label: '50g(泡发后约150g)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y05', category: 'soy', name: '千张',         cal: 260, carbs: 11.0,protein: 24.5, fat: 12.0,servings: [{ label: '1张', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'y06', category: 'soy', name: '毛豆',         cal: 131, carbs: 9.0, protein: 11.6, fat: 4.5, servings: [{ label: '1碗', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'y07', category: 'soy', name: '黄豆',         cal: 390, carbs: 30.0,protein: 35.0, fat: 16.0, servings: [{ label: '50g', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y08', category: 'soy', name: '红豆',         cal: 324, carbs: 56.6,protein: 20.2, fat: 0.6, servings: [{ label: '50g(干)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y09', category: 'soy', name: '豆腐干',       cal: 140, carbs: 4.5, protein: 16.0, fat: 6.5, servings: [{ label: '1块', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'y10', category: 'soy', name: '素鸡',         cal: 176, carbs: 8.0, protein: 17.0, fat: 10.0, servings: [{ label: '1根', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'y11', category: 'soy', name: '豆腐泡',       cal: 245, carbs: 9.0, protein: 17.0, fat: 17.5, servings: [{ label: '10个', g: 150 }, { label: '100g', g: 100 }] },
  { id: 'y12', category: 'soy', name: '香干',         cal: 151, carbs: 5.0, protein: 17.5, fat: 7.0, servings: [{ label: '1块', g: 100 }, { label: '100g', g: 100 }] },
  { id: 'y13', category: 'soy', name: '腐乳',         cal: 130, carbs: 4.0, protein: 10.0, fat: 8.0, servings: [{ label: '1块', g: 15 }, { label: '100g', g: 100 }] },
  { id: 'y14', category: 'soy', name: '绿豆',         cal: 329, carbs: 56.0,protein: 21.6, fat: 0.8, servings: [{ label: '50g(干)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y15', category: 'soy', name: '绿豆汤',       cal: 35,  carbs: 7.0, protein: 1.5, fat: 0.1, servings: [{ label: '1碗', g: 300 }, { label: '100g', g: 100 }] },

  // ========== 零食饮品 ==========
  { id: 'k01', category: 'snack', name: '可乐',         cal: 42,  carbs: 10.6, protein: 0.0, fat: 0.0, servings: [{ label: '1罐(330ml)', g: 330 }, { label: '100ml', g: 100 }] },
  { id: 'k02', category: 'snack', name: '雪碧',         cal: 41,  carbs: 10.1, protein: 0.0, fat: 0.0, servings: [{ label: '1罐(330ml)', g: 330 }, { label: '100ml', g: 100 }] },
  { id: 'k03', category: 'snack', name: '橙汁',         cal: 45,  carbs: 10.2, protein: 0.7, fat: 0.1, servings: [{ label: '1杯(300ml)', g: 300 }, { label: '100ml', g: 100 }] },
  { id: 'k04', category: 'snack', name: '啤酒',         cal: 32,  carbs: 2.6,  protein: 0.3, fat: 0.0, servings: [{ label: '1罐(330ml)', g: 330 }, { label: '1瓶(500ml)', g: 500 }, { label: '100ml', g: 100 }] },
  { id: 'k05', category: 'snack', name: '奶茶（珍珠）', cal: 75,  carbs: 12.0, protein: 1.0, fat: 2.5, servings: [{ label: '1杯中杯', g: 500 }, { label: '100ml', g: 100 }] },
  { id: 'k06', category: 'snack', name: '拿铁咖啡',     cal: 56,  carbs: 4.5,  protein: 3.0, fat: 3.0, servings: [{ label: '1杯中杯', g: 350 }, { label: '100ml', g: 100 }] },
  { id: 'k07', category: 'snack', name: '美式咖啡（黑）', cal: 3,  carbs: 0.4,  protein: 0.2, fat: 0.0, servings: [{ label: '1杯中杯', g: 350 }, { label: '100ml', g: 100 }] },
  { id: 'k08', category: 'snack', name: '薯片',         cal: 536, carbs: 53.0, protein: 5.0, fat: 34.0,servings: [{ label: '1包', g: 75 }, { label: '100g', g: 100 }] },
  { id: 'k09', category: 'snack', name: '巧克力',       cal: 546, carbs: 60.0, protein: 4.0, fat: 32.0,servings: [{ label: '1小块', g: 15 }, { label: '100g', g: 100 }] },
  { id: 'k10', category: 'snack', name: '蛋糕（奶油）', cal: 347, carbs: 48.0, protein: 5.5, fat: 14.0,servings: [{ label: '1块', g: 100 }, { label: '100g', g: 100 }] },
  { id: 'k11', category: 'snack', name: '辣条',         cal: 450, carbs: 45.0, protein: 8.0, fat: 25.0,servings: [{ label: '1包', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'k12', category: 'snack', name: '牛肉干',       cal: 550, carbs: 15.0, protein: 45.0, fat: 40.0,servings: [{ label: '1包', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'k13', category: 'snack', name: '坚果（混合）', cal: 580, carbs: 18.0, protein: 18.0, fat: 48.0,servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k14', category: 'snack', name: '瓜子',         cal: 582, carbs: 12.0, protein: 22.0, fat: 48.0,servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k15', category: 'snack', name: '话梅',         cal: 240, carbs: 52.0, protein: 1.7, fat: 1.3, servings: [{ label: '5颗', g: 20 }, { label: '100g', g: 100 }] },
  { id: 'k16', category: 'snack', name: '果冻',         cal: 74,  carbs: 17.0, protein: 0.1, fat: 0.1, servings: [{ label: '1个', g: 40 }, { label: '100g', g: 100 }] },
  { id: 'k17', category: 'snack', name: '运动饮料',     cal: 26,  carbs: 6.4,  protein: 0.0, fat: 0.0, servings: [{ label: '1瓶(500ml)', g: 500 }, { label: '100ml', g: 100 }] },
  { id: 'k18', category: 'snack', name: '凉茶',         cal: 24,  carbs: 5.8,  protein: 0.0, fat: 0.0, servings: [{ label: '1罐(310ml)', g: 310 }, { label: '100ml', g: 100 }] },
  // 饮料
  { id: 'k19', category: 'snack', name: '酸梅汤',       cal: 32,  carbs: 7.8,  protein: 0.0, fat: 0.0, servings: [{ label: '1杯(300ml)', g: 300 }, { label: '100ml', g: 100 }] },
  { id: 'k20', category: 'snack', name: '椰汁',         cal: 40,  carbs: 7.0,  protein: 0.3, fat: 1.3, servings: [{ label: '1罐(330ml)', g: 330 }, { label: '100ml', g: 100 }] },
  { id: 'k21', category: 'snack', name: '豆奶',         cal: 45,  carbs: 4.0,  protein: 2.5, fat: 1.8, servings: [{ label: '1盒(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'k22', category: 'snack', name: '维他奶',       cal: 55,  carbs: 8.0,  protein: 2.0, fat: 1.5, servings: [{ label: '1盒(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'k23', category: 'snack', name: '红牛',         cal: 46,  carbs: 11.0, protein: 0.3, fat: 0.0, servings: [{ label: '1罐(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'k24', category: 'snack', name: '宝矿力',       cal: 26,  carbs: 6.5,  protein: 0.0, fat: 0.0, servings: [{ label: '1瓶(500ml)', g: 500 }, { label: '100ml', g: 100 }] },
  { id: 'k25', category: 'snack', name: '冰红茶',       cal: 38,  carbs: 9.5,  protein: 0.0, fat: 0.0, servings: [{ label: '1瓶(500ml)', g: 500 }, { label: '100ml', g: 100 }] },
  { id: 'k26', category: 'snack', name: '绿茶（无糖）', cal: 1,   carbs: 0.2,  protein: 0.0, fat: 0.0, servings: [{ label: '1杯(300ml)', g: 300 }, { label: '100ml', g: 100 }] },
  { id: 'k27', category: 'snack', name: '柠檬茶',       cal: 42,  carbs: 10.5, protein: 0.0, fat: 0.0, servings: [{ label: '1盒(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'k28', category: 'snack', name: '气泡水（无糖）', cal: 0,  carbs: 0.0,  protein: 0.0, fat: 0.0, servings: [{ label: '1罐(330ml)', g: 330 }, { label: '100ml', g: 100 }] },
  // 酒精类
  { id: 'k29', category: 'snack', name: '白酒（52度）', cal: 311, carbs: 0.5,  protein: 0.0, fat: 0.0, servings: [{ label: '1两(50ml)', g: 50 }, { label: '100ml', g: 100 }] },
  { id: 'k30', category: 'snack', name: '红酒',         cal: 85,  carbs: 3.5,  protein: 0.1, fat: 0.0, servings: [{ label: '1杯(150ml)', g: 150 }, { label: '1瓶(750ml)', g: 750 }, { label: '100ml', g: 100 }] },
  { id: 'k31', category: 'snack', name: '黄酒',         cal: 66,  carbs: 1.5,  protein: 0.5, fat: 0.0, servings: [{ label: '1杯(100ml)', g: 100 }, { label: '100ml', g: 100 }] },
  { id: 'k32', category: 'snack', name: '米酒/醪糟',    cal: 55,  carbs: 10.0, protein: 0.6, fat: 0.1, servings: [{ label: '1小碗', g: 200 }, { label: '100ml', g: 100 }] },
  { id: 'k33', category: 'snack', name: '清酒',         cal: 108, carbs: 4.5,  protein: 0.3, fat: 0.0, servings: [{ label: '1壶(180ml)', g: 180 }, { label: '100ml', g: 100 }] },
  { id: 'k34', category: 'snack', name: '威士忌',       cal: 250, carbs: 0.1,  protein: 0.0, fat: 0.0, servings: [{ label: '1杯(45ml)', g: 45 }, { label: '100ml', g: 100 }] },
  { id: 'k35', category: 'snack', name: '鸡尾酒',       cal: 120, carbs: 12.0, protein: 0.2, fat: 0.1, servings: [{ label: '1杯', g: 250 }, { label: '100ml', g: 100 }] },
  // 零食
  { id: 'k36', category: 'snack', name: '奥利奥',       cal: 480, carbs: 69.0, protein: 5.0, fat: 20.0, servings: [{ label: '3块', g: 30 }, { label: '1包', g: 97 }, { label: '100g', g: 100 }] },
  { id: 'k37', category: 'snack', name: '锅巴',         cal: 480, carbs: 60.0, protein: 6.0, fat: 24.0, servings: [{ label: '1包', g: 60 }, { label: '100g', g: 100 }] },
  { id: 'k38', category: 'snack', name: '蛋黄派',       cal: 430, carbs: 50.0, protein: 5.0, fat: 23.0, servings: [{ label: '1个', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k39', category: 'snack', name: '旺旺雪饼',     cal: 432, carbs: 72.0, protein: 5.0, fat: 13.0, servings: [{ label: '2片', g: 20 }, { label: '1包', g: 100 }, { label: '100g', g: 100 }] },
  { id: 'k40', category: 'snack', name: '麻薯',         cal: 290, carbs: 52.0, protein: 3.0, fat: 7.0,  servings: [{ label: '2个', g: 60 }, { label: '100g', g: 100 }] },
  { id: 'k41', category: 'snack', name: '肉松饼',       cal: 405, carbs: 45.0, protein: 8.0, fat: 20.0, servings: [{ label: '1个', g: 45 }, { label: '100g', g: 100 }] },
  // 坚果
  { id: 'k42', category: 'snack', name: '花生（炒）',   cal: 589, carbs: 16.0, protein: 26.0, fat: 46.0, servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k43', category: 'snack', name: '腰果',         cal: 552, carbs: 26.0, protein: 18.0, fat: 44.0, servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k44', category: 'snack', name: '开心果',       cal: 557, carbs: 18.0, protein: 21.0, fat: 46.0, servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k45', category: 'snack', name: '杏仁',         cal: 562, carbs: 18.0, protein: 22.0, fat: 46.0, servings: [{ label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  { id: 'k46', category: 'snack', name: '核桃',         cal: 646, carbs: 10.0, protein: 15.0, fat: 62.0, servings: [{ label: '2个', g: 15 }, { label: '1把(30g)', g: 30 }, { label: '100g', g: 100 }] },
  // 甜品
  { id: 'k47', category: 'snack', name: '冰棍/老冰棍',  cal: 60,  carbs: 14.5, protein: 0.1, fat: 0.1, servings: [{ label: '1根', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'k48', category: 'snack', name: '雪糕（奶油）', cal: 227, carbs: 26.0, protein: 3.0, fat: 12.0, servings: [{ label: '1支', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'k49', category: 'snack', name: '布丁',         cal: 120, carbs: 19.0, protein: 2.5, fat: 3.5, servings: [{ label: '1杯', g: 100 }, { label: '100g', g: 100 }] },
  // 西式快餐
  { id: 'k50', category: 'snack', name: '汉堡',         cal: 256, carbs: 30.0, protein: 12.0, fat: 10.0, servings: [{ label: '1个', g: 180 }, { label: '100g', g: 100 }] },
  { id: 'k51', category: 'snack', name: '薯条',         cal: 312, carbs: 41.0, protein: 3.4, fat: 15.0, servings: [{ label: '1中份', g: 110 }, { label: '100g', g: 100 }] },
  { id: 'k52', category: 'snack', name: '炸鸡块',       cal: 260, carbs: 15.0, protein: 16.0, fat: 16.0, servings: [{ label: '5块', g: 100 }, { label: '100g', g: 100 }] },
  { id: 'k53', category: 'snack', name: '披萨',         cal: 235, carbs: 28.0, protein: 11.0, fat: 9.0,  servings: [{ label: '1片', g: 120 }, { label: '100g', g: 100 }] },
  { id: 'k54', category: 'snack', name: '热狗',         cal: 290, carbs: 27.0, protein: 10.0, fat: 16.0, servings: [{ label: '1个', g: 150 }, { label: '100g', g: 100 }] },

  // ========== 中式菜品 ==========
  { id: 'c01', category: 'dish', name: '番茄炒蛋',       cal: 85,  carbs: 4.0,  protein: 5.5,  fat: 5.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c02', category: 'dish', name: '宫保鸡丁',       cal: 155, carbs: 5.7,  protein: 14.0, fat: 8.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c03', category: 'dish', name: '鱼香肉丝',       cal: 150, carbs: 6.0,  protein: 9.0,  fat: 9.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c04', category: 'dish', name: '红烧肉',         cal: 305, carbs: 3.5,  protein: 9.0,  fat: 28.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c05', category: 'dish', name: '麻婆豆腐',       cal: 95,  carbs: 3.8,  protein: 6.0,  fat: 6.0,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c06', category: 'dish', name: '糖醋里脊',       cal: 220, carbs: 27.0, protein: 13.0, fat: 6.0,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c07', category: 'dish', name: '回锅肉',         cal: 240, carbs: 3.0,  protein: 10.0, fat: 20.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c08', category: 'dish', name: '酸辣土豆丝',     cal: 65,  carbs: 8.5,  protein: 1.5,  fat: 3.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c09', category: 'dish', name: '地三鲜',         cal: 145, carbs: 14.0, protein: 3.0,  fat: 9.0,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c10', category: 'dish', name: '蒜蓉西兰花',     cal: 45,  carbs: 4.0,  protein: 3.5,  fat: 1.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c11', category: 'dish', name: '蛋炒饭',         cal: 163, carbs: 22.0, protein: 5.5,  fat: 5.5,  servings: [{ label: '1盘', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c12', category: 'dish', name: '牛肉面',         cal: 98,  carbs: 12.0, protein: 5.5,  fat: 3.0,  servings: [{ label: '1碗', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c13', category: 'dish', name: '麻辣烫（清汤）', cal: 80,  carbs: 6.0,  protein: 5.0,  fat: 3.5,  servings: [{ label: '1碗', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c14', category: 'dish', name: '火锅（清汤锅底）', cal: 120, carbs: 4.0, protein: 12.0, fat: 6.0, servings: [{ label: '1人份', g: 600 }, { label: '100g', g: 100 }] },
  { id: 'c15', category: 'dish', name: '黄焖鸡',         cal: 135, carbs: 4.0,  protein: 13.0, fat: 7.5,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c16', category: 'dish', name: '水煮鱼',         cal: 165, carbs: 3.0,  protein: 14.5, fat: 11.0, servings: [{ label: '1份', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c17', category: 'dish', name: '炒青菜',         cal: 42,  carbs: 3.0,  protein: 2.0,  fat: 2.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c18', category: 'dish', name: '烧茄子',         cal: 120, carbs: 10.0, protein: 2.0,  fat: 8.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c19', category: 'dish', name: '口水鸡',         cal: 175, carbs: 5.0,  protein: 16.0, fat: 10.0, servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c20', category: 'dish', name: '酸菜鱼',         cal: 95,  carbs: 2.0,  protein: 10.0, fat: 5.5,  servings: [{ label: '1份', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c21', category: 'dish', name: '炸鸡腿',         cal: 260, carbs: 12.0, protein: 17.0, fat: 16.0, servings: [{ label: '1个', g: 120 }, { label: '100g', g: 100 }] },
  { id: 'c22', category: 'dish', name: '锅包肉',         cal: 230, carbs: 25.0, protein: 10.0, fat: 10.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c23', category: 'dish', name: '小炒肉',         cal: 170, carbs: 4.0,  protein: 12.0, fat: 12.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c24', category: 'dish', name: '干煸四季豆',     cal: 110, carbs: 9.0,  protein: 3.5,  fat: 7.0,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c25', category: 'dish', name: '凉拌黄瓜',       cal: 30,  carbs: 3.5,  protein: 1.0,  fat: 1.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  // 家常菜
  { id: 'c26', category: 'dish', name: '京酱肉丝',       cal: 155, carbs: 8.0,  protein: 13.0, fat: 8.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c27', category: 'dish', name: '木须肉',         cal: 125, carbs: 4.0,  protein: 10.0, fat: 7.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c28', category: 'dish', name: '糖醋排骨',       cal: 260, carbs: 22.0, protein: 15.0, fat: 12.0, servings: [{ label: '1份(6块)', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c29', category: 'dish', name: '可乐鸡翅',       cal: 210, carbs: 12.0, protein: 16.0, fat: 11.0, servings: [{ label: '1份(6个)', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c30', category: 'dish', name: '辣子鸡',         cal: 190, carbs: 6.0,  protein: 15.0, fat: 12.0, servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c31', category: 'dish', name: '干锅花菜',       cal: 95,  carbs: 7.0,  protein: 4.0,  fat: 6.0,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c32', category: 'dish', name: '干锅土豆片',     cal: 132, carbs: 14.0, protein: 2.5,  fat: 8.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c33', category: 'dish', name: '虎皮青椒',       cal: 55,  carbs: 5.0,  protein: 1.5,  fat: 3.5,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c34', category: 'dish', name: '醋溜白菜',       cal: 35,  carbs: 4.0,  protein: 1.5,  fat: 1.5,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c35', category: 'dish', name: '蒜蓉生菜',       cal: 32,  carbs: 2.5,  protein: 1.8,  fat: 1.8,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c36', category: 'dish', name: '清蒸鲈鱼',       cal: 105, carbs: 0.5,  protein: 18.0, fat: 3.5,  servings: [{ label: '1条(中)', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c37', category: 'dish', name: '剁椒鱼头',       cal: 98,  carbs: 2.0,  protein: 12.0, fat: 4.5,  servings: [{ label: '1份(半个头)', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c38', category: 'dish', name: '葱爆羊肉',       cal: 180, carbs: 4.0,  protein: 15.0, fat: 12.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c39', category: 'dish', name: '孜然牛肉',       cal: 160, carbs: 5.0,  protein: 18.0, fat: 8.0,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c40', category: 'dish', name: '铁板豆腐',       cal: 105, carbs: 5.0,  protein: 7.0,  fat: 6.0,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c41', category: 'dish', name: '皮蛋豆腐',       cal: 85,  carbs: 3.0,  protein: 8.0,  fat: 4.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c42', category: 'dish', name: '毛血旺',         cal: 130, carbs: 3.0,  protein: 12.0, fat: 8.0,  servings: [{ label: '1份', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c43', category: 'dish', name: '夫妻肺片',       cal: 145, carbs: 3.5,  protein: 14.0, fat: 9.0,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c44', category: 'dish', name: '蒜泥白肉',       cal: 260, carbs: 3.0,  protein: 14.0, fat: 22.0, servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'c45', category: 'dish', name: '韭菜炒鸡蛋',     cal: 110, carbs: 3.5,  protein: 7.5,  fat: 7.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c46', category: 'dish', name: '香菇青菜',       cal: 40,  carbs: 4.0,  protein: 2.5,  fat: 1.5,  servings: [{ label: '1份', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c47', category: 'dish', name: '腰果虾仁',       cal: 140, carbs: 8.0,  protein: 14.0, fat: 6.0,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c48', category: 'dish', name: '西芹炒牛肉',     cal: 110, carbs: 5.0,  protein: 12.0, fat: 4.5,  servings: [{ label: '1份', g: 250 }, { label: '100g', g: 100 }] },
  { id: 'c49', category: 'dish', name: '黑椒牛柳',       cal: 150, carbs: 6.0,  protein: 17.0, fat: 7.0,  servings: [{ label: '1份', g: 200 }, { label: '100g', g: 100 }] },
  // 汤品 / 面食类
  { id: 'c50', category: 'dish', name: '西红柿鸡蛋汤',   cal: 28,  carbs: 2.5,  protein: 1.5,  fat: 1.2,  servings: [{ label: '1碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c51', category: 'dish', name: '紫菜蛋花汤',     cal: 18,  carbs: 1.5,  protein: 1.2,  fat: 0.8,  servings: [{ label: '1碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c52', category: 'dish', name: '酸辣汤',         cal: 35,  carbs: 4.0,  protein: 2.0,  fat: 1.2,  servings: [{ label: '1碗', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'c53', category: 'dish', name: '排骨汤',         cal: 55,  carbs: 1.0,  protein: 4.0,  fat: 4.0,  servings: [{ label: '1碗', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c54', category: 'dish', name: '牛肉拉面',       cal: 105, carbs: 14.0, protein: 5.5,  fat: 3.0,  servings: [{ label: '1碗', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c55', category: 'dish', name: '担担面',         cal: 130, carbs: 16.0, protein: 5.0,  fat: 5.5,  servings: [{ label: '1碗', g: 350 }, { label: '100g', g: 100 }] },
  { id: 'c56', category: 'dish', name: '炸酱面',         cal: 155, carbs: 20.0, protein: 7.0,  fat: 5.0,  servings: [{ label: '1碗', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c57', category: 'dish', name: '热干面',         cal: 170, carbs: 25.0, protein: 6.0,  fat: 5.0,  servings: [{ label: '1碗', g: 350 }, { label: '100g', g: 100 }] },
  { id: 'c58', category: 'dish', name: '螺蛳粉',         cal: 125, carbs: 18.0, protein: 4.0,  fat: 4.0,  servings: [{ label: '1碗', g: 400 }, { label: '100g', g: 100 }] },
  { id: 'c59', category: 'dish', name: '兰州拉面',       cal: 100, carbs: 14.0, protein: 5.0,  fat: 2.5,  servings: [{ label: '1碗', g: 500 }, { label: '100g', g: 100 }] },
  { id: 'c60', category: 'dish', name: '酸辣粉',         cal: 115, carbs: 17.0, protein: 3.0,  fat: 4.0,  servings: [{ label: '1碗', g: 350 }, { label: '100g', g: 100 }] },
];

// ==================== 查询接口 ====================

/**
 * 根据关键词模糊搜索食物
 * @param {string} query - 搜索词
 * @param {number} limit - 返回数量上限
 * @returns {Array} 匹配的食物列表
 */
function searchFoods(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results = FOOD_DATABASE.filter(food => {
    // 匹配名称
    if (food.name.toLowerCase().includes(q)) return true;
    // 匹配分类
    const cat = CATEGORIES[food.category];
    if (cat && cat.name.includes(q)) return true;
    // 拼音首字母模糊匹配（支持简写）
    return false;
  });
  return results.slice(0, limit);
}

/**
 * 根据 ID 获取单个食物
 * @param {string} id
 * @returns {Object|null}
 */
function getFoodById(id) {
  return FOOD_DATABASE.find(f => f.id === id) || null;
}

/**
 * 按分类获取食物
 * @param {string} categoryId
 * @returns {Array}
 */
function getFoodsByCategory(categoryId) {
  return FOOD_DATABASE.filter(f => f.category === categoryId);
}

/**
 * 获取所有食物
 * @returns {Array}
 */
function getAllFoods() {
  return FOOD_DATABASE;
}

/**
 * 获取分类列表
 * @returns {Object}
 */
function getCategories() {
  return CATEGORIES;
}

/**
 * 计算食物在指定克数下的营养素
 * @param {Object} food - 食物对象
 * @param {number} grams - 克数
 * @returns {Object} { calories, carbs, protein, fat }
 */
function calcNutrition(food, grams) {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.cal * ratio),
    carbs:    Math.round(food.carbs * ratio * 10) / 10,
    protein:  Math.round(food.protein * ratio * 10) / 10,
    fat:      Math.round(food.fat * ratio * 10) / 10,
  };
}

// ==================== 控制台诊断 ====================
console.log(
  '🍎 食物数据库已加载：' + FOOD_DATABASE.length + ' 种食物，' +
  Object.keys(CATEGORIES).length + ' 个分类'
);
