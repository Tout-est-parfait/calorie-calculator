/**
 * 拦截 /proxy/* 路径，防止代理配置文件被公开访问
 * Cloudflare Pages Functions 优先于静态文件，返回 404
 */
export async function onRequest() {
  return new Response('Not Found', { status: 404 });
}
