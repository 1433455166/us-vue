<template>
  <div class="playlist-mask" @click.self="$emit('close')">
    <transition name="playlist-slide" appear>
      <div class="playlist-panel more-panel">
        <div class="playlist-header">
          <h3>更多</h3>
          <button class="close-btn" @click="$emit('close')" aria-label="关闭">
            <SvgClose variant="line" :size="20" />
          </button>
        </div>
        <div class="more-body">
          <section class="more-section">
            <p class="more-label">定时关闭</p>
            <div class="more-options">
              <button
                v-for="m in timerOptions"
                :key="m"
                class="more-opt"
                :class="{ active: timerMinutes === m }"
                @click="$emit('set-timer', m)"
              >
                {{ m === 0 ? '关闭' : m + '分钟' }}
              </button>
            </div>
            <p v-if="timerMinutes > 0" class="timer-hint">
              将在 {{ formatTime(remainingTime) }} 后停止播放
            </p>
          </section>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import SvgClose from '../../../../components/svgIcon/SvgClose.vue';

defineProps({
  timerOptions: { type: Array, required: true },
  timerMinutes: { type: Number, default: 0 },
  remainingTime: { type: Number, default: 0 },
});

defineEmits(['close', 'set-timer']);

function formatTime(s) {
  if (!s || isNaN(s)) return '00:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
</script>

<style scoped>
.playlist-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.playlist-panel {
  width: 100%;
  height: 1000lpx;
  border-top-left-radius: 32lpx;
  border-top-right-radius: 32lpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -16lpx 49lpx rgba(0, 0, 0, 0.4);
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20lpx 49lpx;
  border-bottom: 2lpx solid rgba(255, 255, 255, 0.1);
}

.playlist-header h3 {
  margin: 0;
  font-size: 32lpx;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
  width: 49lpx;
  height: 49lpx;
  padding: 0;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.1); }

/* 更多面板 */
.more-panel {
  background: linear-gradient(180deg, #2b2b30 0%, #1d1d22 100%);
  max-height: 70vh;
}

.more-body {
  padding: 16lpx 24lpx 32lpx;
  overflow-y: auto;
}

.more-section { margin-bottom: 24lpx; }

.more-section:last-child { margin-bottom: 0; }

.more-label {
  margin: 0 0 12lpx;
  font-size: 24lpx;
  color: rgba(255, 255, 255, 0.55);
}

.more-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12lpx;
}

.more-opt {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24lpx;
  padding: 10lpx 22lpx;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.more-opt:hover { background: rgba(255, 255, 255, 0.16); }

.more-opt.active {
  background: #1ed760;
  color: #000;
  font-weight: 600;
}

.timer-hint {
  margin: 10lpx 0 0;
  font-size: 22lpx;
  color: #1ed760;
}

.playlist-slide-enter-active, .playlist-slide-leave-active { transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); }
.playlist-slide-enter-from, .playlist-slide-leave-to { transform: translateY(100%); }
</style>
