<template>
  <div class="playlist-mask" @click.self="$emit('close')">
    <transition name="playlist-slide" appear>
      <div class="playlist-panel song-panel">
        <div class="playlist-header">
          <h3>播放列表 <span class="count">({{ songs.length }})</span></h3>
          <button class="close-btn" @click="$emit('close')" aria-label="关闭">
            <SvgClose variant="line" :size="20" />
          </button>
        </div>
        <ul class="playlist">
          <li
            v-for="(song, idx) in songs"
            :key="song.id"
            :class="{ active: idx === currentIndex, playing: idx === currentIndex && isPlaying }"
            @click="$emit('play-at', idx)"
          >
            <span class="pl-index">{{ idx === currentIndex && isPlaying ? '♪' : idx + 1 }}</span>
            <div class="pl-info">
              <p class="pl-title">{{ song.title }}</p>
              <p class="pl-divider">-</p>
              <p class="pl-artist">{{ song.artist }}</p>
            </div>
            <span class="pl-duration">{{ song.duration }}</span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import SvgClose from '../../../../components/svgIcon/SvgClose.vue';

defineProps({
  songs: { type: Array, required: true },
  currentIndex: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
});

defineEmits(['close', 'play-at']);
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

.song-panel {
  background: #582828;
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

.playlist-header .count {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  font-size: 27lpx;
  margin-left: 8lpx;
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

.playlist {
  list-style: none;
  margin: 0;
  padding: 8lpx 0;
  overflow-y: auto;
  flex: 1;
}

.playlist li {
  display: flex;
  align-items: center;
  gap: 24lpx;
  padding: 20lpx 40lpx;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist li:hover { background: rgba(255, 255, 255, 0.05); }

.playlist li.active { color: #1ed760; }
.playlist li.active .pl-index { color: #1ed760; }

.pl-index {
  width: 49lpx;
  text-align: center;
  font-size: 27lpx;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.pl-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.pl-title {
  font-size: 27lpx;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-divider {
  margin: 0 8lpx;
}

.pl-artist {
  margin: 0;
  font-size: 24lpx;
  opacity: .5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-duration {
  font-size: 24lpx;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.playlist-slide-enter-active, .playlist-slide-leave-active { transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); }
.playlist-slide-enter-from, .playlist-slide-leave-to { transform: translateY(100%); }
</style>
