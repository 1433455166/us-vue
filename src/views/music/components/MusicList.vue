<template>
  <div class="music-list-container">
    <div class="list-header">
      <h2>音乐列表</h2>
      <p>共 {{ musicList.length }} 首歌曲</p>
    </div>
    
    <div class="music-list">
      <div 
        v-for="(song, index) in musicList" 
        :key="index" 
        class="music-item"
        :class="{ active: isCurrent(song) }"
        @click="playSong(song)"
      >
        <div class="song-info">
          <div class="thumb-wrap">
            <img
              v-if="song.cover"
              class="song-thumb"
              :src="getAssetUrl(song.cover)"
              :alt="song.title"
              loading="lazy"
            />
            <div v-else class="song-thumb fallback">{{ song.title.charAt(0) }}</div>
          </div>
          <div class="song-text">
            <h3 class="song-title">{{ song.title }}</h3>
            <p class="song-artist">{{ song.artist }}</p>
          </div>
        </div>
        <div class="song-actions">
          <button class="play-btn" @click.stop="togglePlay(song)">
            <span
              v-if="isCurrent(song) && playerState.playing"
              class="eq eq-in-btn"
            >
              <span class="eq-bar"></span>
              <span class="eq-bar"></span>
              <span class="eq-bar"></span>
            </span>
            <template v-else>▶️</template>
          </button>
        </div>
      </div>
    </div>

    <!-- 正在播放状态模块 -->
    <div v-if="currentSong" class="player-status">
      <div class="ps-controls">
        <button class="ps-btn" @click.stop="prevSong" aria-label="上一首">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M6 6h2v12H6zM20 6l-10 6 10 6z"></path>
          </svg>
        </button>
        <button
          class="ps-btn"
          @click.stop="togglePlayerStatus"
          :aria-label="playerState.playing ? '暂停' : '播放'"
        >
          <span v-if="playerState.playing" class="pause-glyph">
            <span class="pause-glyph-bar"></span>
            <span class="pause-glyph-bar"></span>
          </span>
          <span v-else class="play-glyph"></span>
        </button>
        <button class="ps-btn" @click.stop="nextSong" aria-label="下一首">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M16 6h2v12h-2zM4 6l10 6-10 6z"></path>
          </svg>
        </button>
      </div>
      <div class="ps-meta" @click="openPlayer">
        <span class="ps-title">{{ currentSong.title }}</span>
        <span class="ps-time">{{ formatTime(currentTime) }} / {{ duration ? formatTime(duration) : currentSong.duration || '00:00' }}</span>
      </div>
      <span v-if="playerState.playing" class="eq">
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
      </span>
    </div>
    
    <div v-if="musicList.length === 0" class="empty-state">
      <p>暂无音乐文件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getAssetUrl } from '../../../utils/asset'
import audio, { playerState, playSong as playSongGlobal } from '../../../utils/audioPlayer'

// Props
const props = defineProps({
  musicList: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['play-song'])

// 播放歌曲
const playSong = (song) => {
  emit('play-song', song)
}

// 按钮点击：当前歌曲切换播放/暂停，其他歌曲进入播放页播放
const togglePlay = (song) => {
  if (!isCurrent(song)) {
    playSong(song)
    return
  }
  if (playerState.playing) {
    audio.pause()
  } else {
    audio.play().catch(() => {})
  }
}

// 是否为当前播放的歌曲
const isCurrent = (song) => playerState.songId === song.id

// 当前播放的歌曲信息：未播放时默认展示《抽离》
const DEFAULT_SONG_TITLE = '抽离'
const currentSong = computed(() => {
  return (
    props.musicList.find((s) => s.id === playerState.songId) ||
    props.musicList.find((s) => s.title === DEFAULT_SONG_TITLE) ||
    props.musicList[0] ||
    null
  )
})

// 播放进度（监听全局音频实例）
const currentTime = ref(0)
const duration = ref(0)

function syncProgress() {
  currentTime.value = audio.currentTime || 0
  const d = audio.duration
  if (Number.isFinite(d) && d > 0) duration.value = d
}

function onTimeUpdate() {
  syncProgress()
}

function onLoadedMetadata() {
  syncProgress()
}

onMounted(() => {
  // 主动同步一次：暂停状态下进入列表不会派发 timeupdate，
  // 否则进度会显示 00:00，点播放才跳回实际进度
  syncProgress()
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('loadedmetadata', onLoadedMetadata)
  audio.addEventListener('seeked', onTimeUpdate)
  audio.addEventListener('play', onTimeUpdate)
})

onBeforeUnmount(() => {
  audio.removeEventListener('timeupdate', onTimeUpdate)
  audio.removeEventListener('loadedmetadata', onLoadedMetadata)
  audio.removeEventListener('seeked', onTimeUpdate)
  audio.removeEventListener('play', onTimeUpdate)
})

function formatTime(s) {
  if (!s || isNaN(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// 点击状态模块进入播放页（当前歌暂停中会自动恢复播放）
const openPlayer = () => {
  if (currentSong.value) playSong(currentSong.value)
}

// 状态模块上的播放/暂停切换
const togglePlayerStatus = () => {
  // 尚未播放过任何音乐：从默认展示的歌曲开始播放
  if (playerState.songId == null) {
    if (currentSong.value) playSongGlobal(currentSong.value)
    return
  }
  if (audio.paused) {
    audio.play().catch(() => {})
  } else {
    audio.pause()
  }
}

// 上一首/下一首：直接通过全局播放器就地切歌，不写路由
// （避免 songId 写入历史记录后，回退时被 music.vue 的路由监听切回旧歌）
const playByOffset = (offset) => {
  const list = props.musicList
  if (!list.length) return
  // 基于当前播放歌曲（未播放时基于默认展示的歌曲）计算相邻歌曲
  let idx = list.findIndex((s) => s.id === playerState.songId)
  if (idx === -1 && currentSong.value) {
    idx = list.findIndex((s) => s.id === currentSong.value.id)
  }
  if (idx === -1) idx = 0
  idx = (idx + offset + list.length) % list.length
  playSongGlobal(list[idx])
}

const prevSong = () => playByOffset(-1)
const nextSong = () => playByOffset(1)
</script>

<style scoped>
.music-list-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.list-header {
  text-align: center;
  margin-bottom: 20lpx;
  padding-bottom: 16lpx;
  border-bottom: 2lpx solid #f0f0f0;
}

.list-header h2 {
  color: #2c3e50;
  font-size: 24px;
}

.list-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: calc(100vh - 336lpx);
  overflow-y: auto;
  padding-bottom: 10px;
}

.music-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18lpx;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.music-item:hover {
  background: #f0f4ff;
  transform: translateY(-2px);
  border-color: #667eea;
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
}

.song-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.song-thumb.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.song-text {
  flex: 1;
  min-width: 0;
}

/* 当前播放项高亮 */
.music-item.active {
  background: #f0f4ff;
  border-color: #667eea;
}

/* 动态均衡器图标 */
.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.eq-bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: eq-bounce 0.9s ease-in-out infinite;
}

.eq-bar:nth-child(2) { animation-delay: 0.2s; }
.eq-bar:nth-child(3) { animation-delay: 0.4s; }

.eq.paused .eq-bar {
  animation-play-state: paused;
  height: 6px;
}

@keyframes eq-bounce {
  0%, 100% { height: 5px; }
  50% { height: 14px; }
}

/* 播放按钮内的均衡器：白色小柱 */
.eq-in-btn {
  height: 12px;
}

.eq-in-btn .eq-bar {
  background: #fff;
  height: 12px;
}

/* 正在播放状态模块：固定在页面底部 */
.player-status {
  position: fixed;
  left: 15px;
  right: 15px;
  bottom: 15px;
  max-width: 580px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 50;
  box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
}

.player-status:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.ps-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ps-btn {
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
  transition: background 0.2s;
}

.ps-btn:hover { background: rgba(102, 126, 234, 0.12); }
.ps-btn:active { transform: scale(0.92); }

.ps-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.ps-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ps-time {
  flex-shrink: 0;
  font-size: 11px;
  color: #999;
  font-variant-numeric: tabular-nums;
}

/* 播放/暂停图标 */
.play-glyph {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 0 6px 10px;
  border-color: transparent transparent transparent #667eea;
}

.pause-glyph {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 12px;
}

.pause-glyph-bar {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #667eea;
}

.song-title {
  color: #2c3e50;
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  color: #666;
  margin: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 10px;
  margin-left: 15px;
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-list-container {
    padding: 15px;
    margin: 0 10px;
  }
  
  .list-header h2 {
    font-size: 20px;
  }
  
  .song-title {
    font-size: 15px;
  }
  
  .song-artist {
    font-size: 13px;
  }
  
  .play-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>