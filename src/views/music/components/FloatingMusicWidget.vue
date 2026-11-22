<template>
  <div
    v-if="visible"
    ref="widgetRef"
    class="fm-widget"
    :class="{ expanded, dragging: isDragging }"
    :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    @click="onWidgetClick"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- 收起态：半透明小球（默认半圆吸附屏幕右缘） -->
    <div v-if="!expanded" class="fm-ball">
      <span v-if="playerState.playing" class="eq">
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
      </span>
      <span v-else class="fm-note">♪</span>
    </div>

    <!-- 展开态：单行迷你控制（旋转音乐图标 + 控制） -->
    <div v-else class="fm-card" @click="goToDetail">
      <div class="fm-disc" :class="{ spinning: playerState.playing }">
        <img
          v-if="currentSong && currentSong.cover"
          class="fm-cover"
          :src="getAssetUrl(currentSong.cover)"
          :alt="currentSong.title"
        />
        <span v-else class="fm-note">♫</span>
      </div>
      <div class="fm-controls">
        <button class="fm-btn" @click.stop="playPrev" aria-label="上一首">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M6 6h2v12H6zM20 6l-10 6 10 6z"></path>
          </svg>
        </button>
        <button class="fm-btn" @click.stop="togglePlay" :aria-label="playerState.playing ? '暂停' : '播放'">
          <span v-if="playerState.playing" class="fm-pause">
            <span class="fm-pause-bar"></span>
            <span class="fm-pause-bar"></span>
          </span>
          <span v-else class="fm-play"></span>
        </button>
        <button class="fm-btn" @click.stop="playNext" aria-label="下一首">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M16 6h2v12h-2zM4 6l10 6-10 6z"></path>
          </svg>
        </button>
        <button class="fm-btn fm-btn-close" @click.stop="collapseWidget" aria-label="收起模块">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="6" y1="6" x2="18" y2="18"></line>
            <line x1="18" y1="6" x2="6" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import audio, { playerState, playSong } from '../../../utils/audioPlayer'
import { getAssetUrl } from '../../../utils/asset'
import musicListData from '../../../data/musicList.json'

const route = useRoute()
const router = useRouter()

// 当前播放歌曲（用于显示封面），未匹配到时返回 null 兜底显示音符
const currentSong = computed(
  () => musicListData.find((s) => s.id === playerState.songId) || null
)

// 仅在正在播放音乐、且不在音乐页/音乐列表页时显示；
// 展开卡片暂停后保留 3 秒（keepVisible），期间可继续操作或点关闭立即消失
const HIDE_PATHS = ['/music', '/musicList']
const keepVisible = ref(false)
const visible = computed(
  () => (playerState.playing || keepVisible.value) && !HIDE_PATHS.includes(route.path)
)

const expanded = ref(false)
const isDragging = ref(false)
const widgetRef = ref(null)

// 尺寸常量（用于位置钳制）
const COLLAPSED_SIZE = 48
const EXPANDED_WIDTH = 140
const EXPANDED_HEIGHT = 56

// 位置（fixed 定位的 left/top）
const pos = reactive({ left: 0, top: 0 })

onMounted(() => {
  // 默认吸附屏幕右缘（半个球露在外面），垂直居中
  pos.left = window.innerWidth - COLLAPSED_SIZE / 2
  pos.top = window.innerHeight / 2 - COLLAPSED_SIZE / 2
  resetIdleTimer()
})

onBeforeUnmount(() => {
  if (idleTimer) clearTimeout(idleTimer)
})

// 暂停时保留 3 秒再消失（卡片/球均适用）；恢复播放立即清除。
// 在音乐页/音乐列表页暂停时不保留展示，返回其他页面直接不显示悬浮球。
// flush:'sync' 确保先于下面的 watch(visible) 执行，否则 visible 先变 false
// 会立刻收起卡片，导致保留逻辑失效
watch(
  () => playerState.playing,
  (playing) => {
    if (playing) {
      keepVisible.value = false
      return
    }
    if (HIDE_PATHS.includes(route.path)) {
      keepVisible.value = false
      return
    }
    keepVisible.value = true
    resetIdleTimer()
  },
  { flush: 'sync' }
)

// 切换页面隐藏时收起展开态
watch(visible, (v) => {
  if (!v) {
    expanded.value = false
    resetIdleTimer()
  }
})

// 收起时立刻回到边缘吸附位置，不留在页面中间
watch(expanded, (v) => {
  if (!v) nextTick(() => clampPos())
})

// 位置钳制：收起态横向强制吸附在最近边缘（不可停在页面中间），纵向自由；
// 展开态必须完整可见（尺寸按元素实际大小计算）
function clampPos() {
  const el = widgetRef.value
  const w = el ? el.offsetWidth : (expanded.value ? EXPANDED_WIDTH : COLLAPSED_SIZE)
  const h = el ? el.offsetHeight : (expanded.value ? EXPANDED_HEIGHT : COLLAPSED_SIZE)
  if (expanded.value) {
    pos.left = Math.min(Math.max(pos.left, 8), window.innerWidth - w - 8)
    pos.top = Math.min(Math.max(pos.top, 8), window.innerHeight - h - 8)
  } else {
    const nearRight = pos.left + COLLAPSED_SIZE / 2 >= window.innerWidth / 2
    pos.left = nearRight
      ? window.innerWidth - 22
      : -COLLAPSED_SIZE * 0.45
    pos.top = Math.min(Math.max(pos.top, 8), window.innerHeight - h - 8)
  }
}

// 3 秒无操作：收起展开态并吸附到最近的左/右边缘
let idleTimer = null
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (isDragging.value) {
      // 拖拽中不吸附，松手后重新计时
      resetIdleTimer()
      return
    }
    snapToNearestEdge()
  }, 3000)
}

function snapToNearestEdge() {
  expanded.value = false
  // 已暂停且过了保留期：悬浮球整体消失
  if (!playerState.playing) keepVisible.value = false
  const ballCenterX = pos.left + COLLAPSED_SIZE / 2
  const nearRight = ballCenterX >= window.innerWidth / 2
  pos.left = nearRight
    ? window.innerWidth - COLLAPSED_SIZE / 2
    : -COLLAPSED_SIZE / 2
  clampPos()
}

// 拖拽移动（区分点击与拖动）
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0
let moved = false
let suppressClick = false

function onPointerDown(e) {
  resetIdleTimer()
  suppressClick = false
  // 展开态整体不可拖动（点唱片图标收起，点按钮控制播放）
  if (expanded.value) return
  // 按钮上的按下不作为拖拽起点，保证按钮点击正常
  if (e.target.closest('button')) return
  isDragging.value = true
  moved = false
  startX = e.clientX
  startY = e.clientY
  startLeft = pos.left
  startTop = pos.top
  e.currentTarget.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && Math.hypot(dx, dy) > 6) moved = true
  if (moved) {
    pos.left = startLeft + dx
    pos.top = startTop + dy
    clampPos()
  }
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  resetIdleTimer()
  // 拖拽结束后忽略紧随其后的 click，避免误展开
  suppressClick = moved
}

function onWidgetClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  // 展开态交由卡片内的按钮/唱片处理
  if (expanded.value) return
  expanded.value = true
  // 等卡片渲染后按实际宽度定位：靠哪一侧边缘就朝屏幕内展开，保证完整可见
  nextTick(() => {
    const w = widgetRef.value ? widgetRef.value.offsetWidth : EXPANDED_WIDTH
    const ballCenterX = pos.left + COLLAPSED_SIZE / 2
    pos.left =
      ballCenterX >= window.innerWidth / 2
        ? window.innerWidth - w - 8
        : 8
    clampPos()
  })
}

// 播放控制
function togglePlay() {
  resetIdleTimer()
  if (audio.paused) audio.play().catch(() => {})
  else audio.pause()
}

function playByOffset(offset) {
  resetIdleTimer()
  const list = musicListData
  if (!list.length) return
  let idx = list.findIndex((s) => s.id === playerState.songId)
  if (idx === -1) idx = 0
  idx = (idx + offset + list.length) % list.length
  playSong(list[idx])
}

const playPrev = () => playByOffset(-1)
const playNext = () => playByOffset(1)

// 点击卡片进入音乐详情页（播放页），并同步当前歌曲与播放状态
function goToDetail() {
  const song = currentSong.value
  if (!song) return
  router.push({
    path: '/music',
    query: { songId: song.id, playing: playerState.playing ? 'true' : 'false' },
  })
}

// 关闭按钮：仅收起展示模块、恢复悬浮球状态，不影响播放；
// 暂停状态下收起后悬浮球一并隐藏
function collapseWidget() {
  expanded.value = false
  if (!playerState.playing) keepVisible.value = false
  resetIdleTimer()
  nextTick(() => clampPos())
}
</script>

<style scoped>
.fm-widget {
  position: fixed;
  z-index: 999;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: left 0.35s ease, top 0.35s ease;
}

/* 拖拽过程中关闭位置过渡 */
.fm-widget.dragging {
  transition: none;
}

/* 收起态小球：半透明 */
.fm-ball {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.fm-note {
  color: #fff;
  font-size: 18px;
  opacity: 0.85;
}

/* 展开态：单行迷你卡片 */
.fm-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #667eea;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  opacity: 0.92;
  cursor: grab;
}

/* 音乐图标：播放时旋转 */
.fm-disc {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: radial-gradient(circle at center, #2c3e50 0 28%, #667eea 28% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fm-disc .fm-note {
  font-size: 14px;
}

.fm-disc .fm-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.fm-disc.spinning {
  animation: fm-spin 3s linear infinite;
}

@keyframes fm-spin {
  to { transform: rotate(360deg); }
}

.fm-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.fm-btn {
  background: none;
  border: none;
  color: #667eea;
  width: 26px;
  height: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.fm-btn:active {
  transform: scale(0.92);
}

.fm-btn-close {
  color: #999;
}

/* 播放/暂停图标 */
.fm-play {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 0 6px 10px;
  border-color: transparent transparent transparent #667eea;
  display: inline-block;
}

.fm-pause {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 12px;
}

.fm-pause-bar {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #667eea;
}

/* 均衡器动画（球内白色） */
.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.eq-bar {
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: #fff;
  animation: fm-eq 0.9s ease-in-out infinite;
}

.eq-bar:nth-child(2) { animation-delay: 0.2s; }
.eq-bar:nth-child(3) { animation-delay: 0.4s; }

@keyframes fm-eq {
  0%, 100% { height: 4px; }
  50% { height: 12px; }
}
</style>