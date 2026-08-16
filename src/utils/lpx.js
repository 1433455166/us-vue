const DESIGN_CONFIG_WIDTH = 750; // 设计稿宽度

// ============== 转换函数 ==============
/**
 * 将 lpx 转换为 vw
 * @param {number} lpxValue - lpx值
 * @returns {string} vw值
 */
export const lpxToVw = (lpxValue) => {
  return `${(lpxValue / DESIGN_CONFIG_WIDTH) * 100}vw`
}

/**
 * 获取实际像素值（基于当前视口）
 * @param {number} lpxValue - lpx值
 * @returns {number} px值
 */
export const getActualPx = (lpxValue) => {
  if (typeof window === 'undefined') return 0;
  return (lpxValue / DESIGN_CONFIG_WIDTH) * window.innerWidth;
}

// ============== 长度计算方法 ==============
/**
 * 钳制比例到 0~1 区间
 * @param {number} ratio - 原始比例
 * @returns {number} 0~1
 */
const clampRatio = (ratio) => {
  const r = Number(ratio);
  if (Number.isNaN(r)) return 0;
  return Math.max(0, Math.min(1, r));
}

/**
 * 按比例计算长度（lpx 基准，返回 vw 字符串）
 * 参考 lpxToVw：长度 = 总长 × 比例，再按设计稿 750 换算为 vw
 * @param {number} ratio - 比例 0~1（如播放进度、滚动进度）
 * @param {number} totalLpx - 总长度（lpx）
 * @returns {string} vw 值，如 '50vw'
 */
export const getLengthByRatio = (ratio, totalLpx) => {
  return lpxToVw(clampRatio(ratio) * totalLpx);
}

/**
 * 按比例计算实际像素长度（基于当前视口）
 * 参考 getActualPx：长度 = 总长 × 比例，再按视口宽度换算为 px
 * @param {number} ratio - 比例 0~1
 * @param {number} totalLpx - 总长度（lpx）
 * @returns {number} 实际像素值
 */
export const getLengthPxByRatio = (ratio, totalLpx) => {
  return getActualPx(clampRatio(ratio) * totalLpx);
}