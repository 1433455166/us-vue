<template>
  <div class="music-player">
    <div class="music-info">
      <h2>{{ currentSong.title }}</h2>
      <p>{{ currentSong.artist }}</p>
    </div>
    
    <!-- 音频元素（保持功能但隐藏） -->
    <audio 
      ref="audioRef" 
      :src="currentSong.src" 
      @timeupdate="updateProgress" 
      @loadedmetadata="updateDuration"
      @ended="handleAudioEnded"
      preload="metadata"
      :controlsList="'nodownload nofullscreen noplaybackrate'"
    >
      您的浏览器不支持音频播放。
    </audio>
    
    <div class="audio-controls">
      <!-- 控制按钮：快退 | 播放 | 快进 - 同一行 -->
      <div class="control-row">
        <button @click="skipBackward" class="control-btn">⏪</button>
        <button @click="togglePlayPause" class="control-btn play-btn">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
        <button @click="skipForward" class="control-btn">⏩</button>
      </div>
      
      <!-- 进度条和时间信息 - 恢复到之前位置 -->
      <div class="progress-time-container">
        <div class="progress-container" @click="seekAudio">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="time-info">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>
    
    <div class="playlist" v-if="playlist.length > 1">
      <h3>播放列表</h3>
      <ul>
        <li 
          v-for="(song, index) in playlist" 
          :key="index" 
          class="playlist-item" 
          :class="{ active: currentSongIndex === index }"
          @click="playSong(index)"
        >
          <span class="song-title">{{ song.title }}</span>
          <span class="song-artist">{{ song.artist }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  playlist: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['song-change', 'play-end'])

// 音频相关
const audioRef = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const currentSongIndex = ref(0)
const isPlaying = ref(false)

// 计算属性
const currentSong = ref({ title: '', artist: '', src: '' })

// 监听播放列表变化
watch(() => props.playlist, (newPlaylist) => {
  if (newPlaylist && newPlaylist.length > 0) {
    currentSong.value = { ...newPlaylist[0] }
    currentSongIndex.value = 0
  }
}, { immediate: true })

// 格式化时间 (秒转 MM:SS)
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === Infinity) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 更新进度
const updateProgress = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
    duration.value = audioRef.value.duration || 0
    progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
  }
}

// 更新总时长
const updateDuration = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0
  }
}

// 处理音频结束
const handleAudioEnded = () => {
  progress.value = 0
  currentTime.value = 0
  isPlaying.value = false
  emit('play-end')
  
  // 如果有下一首，自动播放
  if (props.playlist.length > 1) {
    const nextIndex = (currentSongIndex.value + 1) % props.playlist.length
    playSong(nextIndex)
  }
}

// 点击进度条跳转
const seekAudio = (event) => {
  if (audioRef.value && duration.value > 0) {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const newTime = (clickX / rect.width) * duration.value
    audioRef.value.currentTime = newTime
  }
}

// 播放/暂停切换
const togglePlayPause = () => {
  if (audioRef.value) {
    if (isPlaying.value) {
      audioRef.value.pause()
      isPlaying.value = false
    } else {
      audioRef.value.play().catch(e => {
        console.warn('播放失败:', e)
      })
      isPlaying.value = true
    }
  }
}

// 快退10秒
const skipBackward = () => {
  if (audioRef.value && currentTime.value >= 10) {
    audioRef.value.currentTime = currentTime.value - 10
  } else if (audioRef.value) {
    audioRef.value.currentTime = 0
  }
}

// 快进10秒
const skipForward = () => {
  if (audioRef.value && duration.value > 0) {
    const newTime = Math.min(currentTime.value + 10, duration.value)
    audioRef.value.currentTime = newTime
  }
}

// 播放指定歌曲
const playSong = (index) => {
  if (index >= 0 && index < props.playlist.length) {
    currentSongIndex.value = index
    currentSong.value = { ...props.playlist[index] }
    emit('song-change', currentSong.value, index)
    
    // 延迟一下确保DOM更新后再播放
    setTimeout(() => {
      if (audioRef.value) {
        audioRef.value.play().catch(e => {
          console.warn('自动播放被阻止:', e)
        })
        isPlaying.value = true
      }
    }, 100)
  }
}
</script>

<style scoped>
.music-player {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
}

.music-info {
  text-align: center;
  margin-bottom: 30px;
}

.music-info h2 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.music-info p {
  color: #666;
  margin: 0;
  font-size: 16px;
}

/* 隐藏音频元素但保持功能 */
audio {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  margin-bottom: 30px;
}

/* 控制按钮行：快退 | 播放 | 快进 */
.control-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  gap: 20px;
}

.control-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #667eea;
  font-size: 28px; /* 统一大小 */
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.control-btn:hover {
  transform: scale(1.1);
  background: none !important;
}

/* 播放按钮 */
.play-btn {
  font-size: 60px;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
}

/* 进度条和时间容器 */
.progress-time-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-container {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.time-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  color: #666;
  font-size: 14px;
}

.playlist {
  border-top: 1px solid #eee;
  padding-top: 20px;
  width: 100%;
}

.playlist h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 18px;
  text-align: center;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

.playlist-item.active {
  color: #667eea;
  font-weight: bold;
  background-color: #f0f4ff;
}

.song-title {
  font-weight: 500;
}

.song-artist {
  color: #888;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-player {
    padding: 20px;
    margin: 0 10px;
  }
  
  .music-info h2 {
    font-size: 20px;
  }
  
  .control-btn {
    font-size: 24px;
    width: 50px;
    height: 50px;
  }
  
  .play-btn {
    font-size: 50px;
  }
  
  .control-row {
    max-width: 250px;
    gap: 15px;
  }
}
</style>