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

  // ========== 蛋奶类 ==========
  { id: 'd01', category: 'egg_dairy', name: '牛奶（全脂）', cal: 65,  carbs: 5.0, protein: 3.2, fat: 3.6, servings: [{ label: '1杯(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'd02', category: 'egg_dairy', name: '牛奶（脱脂）', cal: 35,  carbs: 5.0, protein: 3.5, fat: 0.3, servings: [{ label: '1杯(250ml)', g: 250 }, { label: '100ml', g: 100 }] },
  { id: 'd03', category: 'egg_dairy', name: '酸奶（原味）', cal: 72,  carbs: 10.0,protein: 3.5, fat: 2.0, servings: [{ label: '1杯', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'd04', category: 'egg_dairy', name: '奶酪',         cal: 350, carbs: 2.0, protein: 25.0, fat: 27.0, servings: [{ label: '1片', g: 20 }, { label: '100g', g: 100 }] },
  { id: 'd05', category: 'egg_dairy', name: '黄油',         cal: 717, carbs: 0.1, protein: 0.9, fat: 81.0, servings: [{ label: '1小块(10g)', g: 10 }, { label: '100g', g: 100 }] },
  { id: 'd06', category: 'egg_dairy', name: '冰淇淋',       cal: 207, carbs: 24.0,protein: 3.5, fat: 10.0, servings: [{ label: '1球', g: 80 }, { label: '100g', g: 100 }] },

  // ========== 豆制品 ==========
  { id: 'y01', category: 'soy', name: '豆腐（嫩）',   cal: 62,  carbs: 2.6, protein: 5.0, fat: 3.5, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'y02', category: 'soy', name: '豆腐（老）',   cal: 81,  carbs: 3.8, protein: 8.1, fat: 3.7, servings: [{ label: '1块', g: 300 }, { label: '100g', g: 100 }] },
  { id: 'y03', category: 'soy', name: '豆浆（无糖）', cal: 31,  carbs: 1.8, protein: 3.0, fat: 1.2, servings: [{ label: '1杯(300ml)', g: 300 }, { label: '100ml', g: 100 }] },
  { id: 'y04', category: 'soy', name: '腐竹（干）',   cal: 459, carbs: 16.0,protein: 44.6, fat: 26.0,servings: [{ label: '50g(泡发后约150g)', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y05', category: 'soy', name: '千张',         cal: 260, carbs: 11.0,protein: 24.5, fat: 12.0,servings: [{ label: '1张', g: 80 }, { label: '100g', g: 100 }] },
  { id: 'y06', category: 'soy', name: '毛豆',         cal: 131, carbs: 9.0, protein: 11.6, fat: 4.5, servings: [{ label: '1碗', g: 200 }, { label: '100g', g: 100 }] },
  { id: 'y07', category: 'soy', name: '黄豆',         cal: 390, carbs: 30.0,protein: 35.0, fat: 16.0, servings: [{ label: '50g', g: 50 }, { label: '100g', g: 100 }] },
  { id: 'y08', category: 'soy', name: '红豆',         cal: 324, carbs: 56.6,protein: 20.2, fat: 0.6, servings: [{ label: '50g(干)', g: 50 }, { label: '100g', g: 100 }] },

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
];

// ==================== 查询接口 ====================

/**
 * 根据关键词模糊搜索食物
 * @param {string} query - 搜索词
 * @param {number} limit - 返回数量上限
 * @returns {Array} 匹配的食物列表
 */
function searchFoods(query, limit = 15) {
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
