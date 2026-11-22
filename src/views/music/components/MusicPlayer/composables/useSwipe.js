// 左右滑动切换歌曲页/歌词页（触摸 + 鼠标）
// touchmove 需由调用方原生绑定（passive:false），本 composable 提供处理函数
// isBlocked: 返回 true 时禁用滑动（如面板打开、进度条拖动中）
export function useSwipe({ page, dragX, dragging, isBlocked }) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isHorizontal = null;
  let rawDx = 0; // 触摸原始水平位移（未被钳制，用于松手判断）
  let mouseDownX = 0;
  let mouseDownY = 0;
  let rawMouseDx = 0; // 鼠标原始水平位移
  let mouseTracking = false;

  // 歌曲页只允许向左滑（到歌词页）；歌词页只允许向右滑（回歌曲页）
  // 显示偏移钳制 ±45，松手判断用原始位移
  const clampOffset = (dx) => (page.value === 0 ? Math.max(dx, -45) : Math.min(dx, 45));

  function finishSwipe(raw) {
    dragging.value = false;
    if (page.value === 0 && raw < -60) page.value = 1;
    else if (page.value === 1 && raw > 60) page.value = 0;
    dragX.value = 0;
  }

  function onTouchStart(e) {
    if (isBlocked()) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    isHorizontal = null;
  }

  function onTouchMove(e) {
    if (isBlocked()) return;
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (isHorizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal) return; // 垂直滚动：不拦截，交给歌词页自身滚动
    e.preventDefault(); // 水平滑动：阻止浏览器手势
    dragging.value = true;
    rawDx = dx;
    dragX.value = clampOffset(dx);
  }

  function onTouchEnd() {
    isHorizontal = null;
    if (!dragging.value) return;
    finishSwipe(rawDx);
  }

  // 鼠标拖拽（桌面调试用）
  function onMouseStart(e) {
    if (isBlocked() || mouseTracking) return;
    mouseTracking = true;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    const onMouseMove = (ev) => {
      const dx = ev.clientX - mouseDownX;
      const dy = ev.clientY - mouseDownY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) < Math.abs(dy)) return;
      ev.preventDefault();
      dragging.value = true;
      rawMouseDx = dx;
      dragX.value = clampOffset(dx);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mouseTracking = false;
      isHorizontal = null;
      if (!dragging.value) return;
      finishSwipe(rawMouseDx);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  return { onTouchStart, onTouchMove, onTouchEnd, onMouseStart };
}
