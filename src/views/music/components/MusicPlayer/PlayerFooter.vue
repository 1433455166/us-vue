<template>
  <footer class="player-bottom">
    <div class="progress-row">
      <span class="time">{{ formatTime(currentTime) }}</span>
      <div
        class="progress"
        :class="{ seeking: isSeeking }"
        ref="progressRef"
        @pointerdown="onProgressDown"
        @pointermove="onProgressMove"
        @pointerup="onProgressUp"
        @pointercancel="onProgressUp"
        @touchstart.stop
        @mousedown.stop
      >
        <div class="progress-bar" :style="{ width: progressPercent + '%' }">
          <div class="progress-dot"></div>
        </div>
      </div>
      <span class="time">{{ formatTime(duration) }}</span>
    </div>

    <div class="controls">
      <button class="ctrl-btn" @click="$emit('cycle-loop-mode')" :class="{ active: loopMode !== 'list' }" aria-label="播放模式">
        <!-- 随机 -->
        <svg v-if="loopMode === 'shuffle'" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
        <!-- 顺序 / 单曲循环 -->
        <svg v-else viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
        <span v-if="loopMode === 'one'" class="badge">1</span>
      </button>

      <button class="ctrl-btn" @click="$emit('prev')" aria-label="上一首">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
          <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"></path>
        </svg>
      </button>

      <button class="ctrl-btn play" @click="$emit('toggle')" :class="{ playing: isPlaying }" aria-label="播放">
        <SvgPlay v-if="!isPlaying" :size="40" />
        <SvgPause v-else :size="40" />
      </button>

      <button class="ctrl-btn" @click="$emit('next')" aria-label="下一首">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
          <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"></path>
        </svg>
      </button>

      <button class="ctrl-btn" @click="$emit('show-playlist')" aria-label="播放列表">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue';
import SvgPlay from '../../../../components/svgIcon/SvgPlay.vue';
import SvgPause from '../../../../components/svgIcon/SvgPause.vue';

const props = defineProps({
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  loopMode: { type: String, default: 'list' },
});

const emit = defineEmits(['seek', 'toggle', 'prev', 'next', 'cycle-loop-mode', 'show-playlist', 'seek-start', 'seek-end']);

const progressRef = ref(null);
const isSeeking = ref(false);
let seekingPointerId = null;

const progressPercent = computed(() => {
  if (!props.duration) return 0;
  return Math.min(100, (props.currentTime / props.duration) * 100);
});

function seekToClientX(clientX) {
  if (!progressRef.value) return;
  const rect = progressRef.value.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  emit('seek', ratio * (props.duration || 0));
}

// 进度条拖动（指针事件统一鼠标/触摸）
function onProgressDown(e) {
  e.stopPropagation();
  isSeeking.value = true;
  seekingPointerId = e.pointerId;
  progressRef.value?.setPointerCapture?.(e.pointerId);
  emit('seek-start');
  seekToClientX(e.clientX);
}

function onProgressMove(e) {
  if (!isSeeking.value || e.pointerId !== seekingPointerId) return;
  e.stopPropagation();
  seekToClientX(e.clientX);
}

function onProgressUp(e) {
  if (e.pointerId !== seekingPointerId) return;
  e.stopPropagation();
  isSeeking.value = false;
  seekingPointerId = null;
  emit('seek-end');
}

function formatTime(s) {
  if (!s || isNaN(s)) return '00:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
</script>

<style scoped>
/* 底部播放器容器：作为 .qq-player 的独立 flex 子项，恢复原有内边距与层级 */
.player-bottom {
  position: relative;
  z-index: 2;
  padding: 12px 24px 28px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: center;
}

.progress {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  touch-action: none;
}

/* 扩大触摸命中区域，便于拖动 */
.progress::before {
  content: '';
  position: absolute;
  top: -12px;
  bottom: -12px;
  left: 0;
  right: 0;
}

.progress-bar {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-dot {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress:hover .progress-dot,
.progress.seeking .progress-dot { opacity: 1; }

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ctrl-btn {
  position: relative;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.92);
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s, transform 0.1s;
}

.ctrl-btn:hover { background: rgba(255, 255, 255, 0.06); }
.ctrl-btn:active { transform: scale(0.95); }

.ctrl-btn.active { color: #1ed760; }

.ctrl-btn.play {
  background: rgba(255, 255, 255, 0.08);
  width: 64px;
  height: 64px;
}

.ctrl-btn.play:hover { background: rgba(255, 255, 255, 0.14); }
.ctrl-btn.play.playing { background: #1ed760; color: #fff; }

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #1ed760;
  color: #000;
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
