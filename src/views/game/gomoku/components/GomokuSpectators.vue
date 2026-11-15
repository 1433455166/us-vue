<template>
  <div ref="rootRef" class="spectators">
    <button
      ref="chipRef"
      class="watch-chip"
      :class="{ open }"
      :title="`${items.length} 人围观中，点击查看`"
      aria-label="围观人数"
      @click="toggle"
    >
      <span class="eye">👀</span>
      <span class="count">{{ items.length }}</span>
    </button>

    <!-- 挂载到 body：避免被游戏容器的 overflow 裁剪 -->
    <teleport to="body">
      <transition name="watch-pop">
        <div
          v-if="open"
          ref="panelRef"
          class="watch-panel"
          :style="panelStyle"
        >
          <div class="panel-head">
            <span class="panel-title">正在围观 · {{ items.length }} 人</span>
            <button class="panel-close" aria-label="关闭" @click="open = false">✕</button>
          </div>

          <div v-if="items.length" class="watch-list">
            <div v-for="item in items" :key="item.id" class="watch-item">
              <span class="avatar" :style="{ background: colorOf(item.name) }">
                {{ (item.name || '观')[0] }}
              </span>
              <span class="name">{{ item.name }}</span>
            </div>
          </div>
          <div v-else class="watch-empty">还没有人围观，喊朋友来看看~</div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// items：真实观众名单，由 watch 心跳维护，元素为 { id, name }
defineProps({
  items: { type: Array, default: () => [] }
})

const PANEL_WIDTH = 208

const open = ref(false)
const rootRef = ref(null)
const chipRef = ref(null)
const panelRef = ref(null)
const panelStyle = ref({})

const COLORS = [
  '#ffd6a5',
  '#cdeac0',
  '#bde0fe',
  '#ffc8dd',
  '#ffe066',
  '#d0bfff',
  '#a8dadc',
  '#ffb4a2'
]
// 按昵称哈希取固定颜色，同一观众颜色稳定
function colorOf(name) {
  const str = String(name || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}

// 面板跟随按钮定位，并保证不超出视口左右边界
function updatePanelStyle() {
  const chip = chipRef.value
  if (!chip) return
  const rect = chip.getBoundingClientRect()
  const width = Math.min(PANEL_WIDTH, window.innerWidth - 24)
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${width}px`
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) updatePanelStyle()
}

// 点击面板外区域自动收起
function handleDocClick(e) {
  if (!open.value) return
  const inChip = rootRef.value && rootRef.value.contains(e.target)
  const inPanel = panelRef.value && panelRef.value.contains(e.target)
  if (!inChip && !inPanel) open.value = false
}
function handleEsc(e) {
  if (e.key === 'Escape') open.value = false
}
function handleReposition() {
  if (open.value) updatePanelStyle()
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  document.addEventListener('keydown', handleEsc)
  window.addEventListener('resize', handleReposition)
  window.addEventListener('scroll', handleReposition, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocClick)
  document.removeEventListener('keydown', handleEsc)
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition, true)
})
</script>

<style scoped>
.spectators {
  position: relative;
  display: flex;
}
.watch-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 32px;
  padding: 0 10px;
  border: none;
  border-radius: 16px;
  background: #fff;
  color: #6b4f2a;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s, box-shadow 0.15s;
}
.watch-chip:active {
  transform: scale(0.94);
}
.watch-chip.open {
  color: #d64045;
  box-shadow: 0 2px 10px rgba(214, 64, 69, 0.28);
}
.eye {
  font-size: 14px;
  line-height: 1;
}
.count {
  min-width: 12px;
  text-align: center;
}

/* ---------- 围观列表面板 ---------- */
.watch-panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  max-height: 260px;
  padding: 8px;
  border-radius: 16px;
  background: #fffdf7;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  z-index: 1200;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px 8px;
  font-size: 12px;
  font-weight: bold;
  color: #8b6b45;
}
.panel-close {
  border: none;
  background: transparent;
  color: #b9a184;
  font-size: 12px;
  cursor: pointer;
}
.watch-list {
  overflow-y: auto;
}
.watch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border-radius: 10px;
}
.watch-item + .watch-item {
  margin-top: 2px;
}
.avatar {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: bold;
  color: #52412b;
}
.name {
  font-size: 13px;
  font-weight: bold;
  color: #52412b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.watch-empty {
  padding: 14px 4px;
  text-align: center;
  font-size: 12px;
  color: #a08c71;
}

/* 展开动画 */
.watch-pop-enter-active,
.watch-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform-origin: top center;
}
.watch-pop-enter-from,
.watch-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .watch-pop-enter-active,
  .watch-pop-leave-active {
    transition: none;
  }
}
</style>
