/**
 * 热量计算器 — Service Worker
 * Phase 9: 离线缓存，PWA 支持
 */

const CACHE_NAME = 'calorie-calc-v3';

// 需要预缓存的所有静态文件
const PRECACHE_URLS = [
  '.',
  'index.html',
  'css/style.css',
  'js/food-database.js',
  'js/auth.js',
  'js/db.js',
  'js/api.js',
  'js/settings.js',
  'js/custom-food.js',
  'js/dashboard.js',
  'js/advisor.js',
  'js/history.js',
  'js/app.js',
  'manifest.json',
];

// ==================== 安装：预缓存 ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ==================== 激活：清理旧缓存 ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ==================== 请求拦截：缓存优先 ====================
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // Never cache API calls — always go to network
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 命中缓存 → 直接返回
      if (cached) return cached;

      // 未命中 → 网络请求并缓存
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // 网络失败 → 返回离线页面（对 HTML 请求）
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
