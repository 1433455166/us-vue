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