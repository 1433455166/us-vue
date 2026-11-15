// public 静态资源基础地址，由 .env 文件的 VITE_ASSET_BASE 决定：
// - 本地开发（.env.development）：留空 → 同源相对路径，资源由 vite dev server 托管 public 目录
// - 线上（.env.production）：配置完整的静态资源服务器地址
// 注意用 ?? 而非 ||：空字符串是合法配置（同源），不应触发兜底
const ASSET_BASE = import.meta.env.VITE_ASSET_BASE ?? '';

/**
 * 获取 public 目录下静态资源的完整 URL
 * 兼容 '/images/a.png'、'images/a.png'、'../../public/images/a.png' 等写法
 * @param {string} path public 目录下的资源路径
 * @returns {string} 完整资源 URL
 */
export function getAssetUrl(path) {
  if (!path) return ''
  // 已是完整地址或 data/blob URI 则原样返回
  if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path
  // 去掉旧的 '../../public/' 前缀与开头的 '/'
  const clean = path.replace(/^(\.\.\/)+public\//, '').replace(/^\/+/, '')
  return `${ASSET_BASE.replace(/\/+$/, '')}/${clean}`
}
