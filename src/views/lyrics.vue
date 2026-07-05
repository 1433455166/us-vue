<template>
  <div class="lyrics-page">
    <audio 
      ref="audioRef" 
      @timeupdate="updateProgress" 
      @loadedmetadata="updateDuration"
      @ended="handleAudioEnded"
      preload="metadata"
    ></audio>
    <BackButton />
    
    <div class="lyrics-header">
      <h1 class="page-title">{{ currentSong?.title || '歌词' }}</h1>
      <p class="artist-name">{{ currentSong?.artist || '' }}</p>
    </div>
    
    <!-- 迷你播放器 -->
    <div class="mini-player" v-if="currentSong">
      <div class="mini-progress-container" @click="seekAudio">
        <div class="mini-progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="mini-controls">
        <span class="time-display">{{ formatTime(currentTime) }}</span>
        <button @click="togglePlayPause" class="mini-play-btn">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
        <span class="time-display">{{ formatTime(duration) }}</span>
      </div>
    </div>
    
    <!-- 歌词显示区域 -->
    <div class="lyrics-content-wrapper" ref="lyricsWrapper">
      <div 
        class="lyrics-scroll"
        :style="{ transform: `translateY(${scrollOffset}px)` }"
      >
        <div 
          v-for="(line, index) in lyrics" 
          :key="index"
          class="lyric-item"
          :class="{ active: currentLyricIndex === index }"
          @click="seekToLyric(line.time)"
        >
          <span class="lyric-text">{{ line.text }}</span>
        </div>
      </div>
    </div>
    
    <!-- 底部操作 -->
    <div class="bottom-actions">
      <button @click="goBack" class="action-btn">返回播放器</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackButton from '../components/BackButton.vue'
import musicListData from '../data/musicList.json'

const route = useRoute()
const router = useRouter()

// 音频相关
const audioRef = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isPlaying = ref(false)

// 歌词相关
const lyrics = ref([])
const currentLyricIndex = ref(-1)
const scrollOffset = ref(0)
const lyricsWrapper = ref(null)

// 当前歌曲
const currentSong = ref({})

// 解析歌词文件（支持 [MM:SS] 和 [MM:SS.xxx] 格式）
const parseLyrics = (text) => {
  const lines = text.split('\n')
  const parsedLyrics = []
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.+)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = match[3] ? parseInt(match[3]) / 1000 : 0
      const text = match[4].trim()
      
      if (text) {
        parsedLyrics.push({
          time: minutes * 60 + seconds + milliseconds,
          text: text
        })
      }
    }
  }
  
  return parsedLyrics.sort((a, b) => a.time - b.time)
}

// 加载歌词
const loadLyrics = async (lyricsPath) => {
  if (!lyricsPath) {
    lyrics.value = []
    return
  }
  
  try {
    const response = await fetch(lyricsPath)
    if (response.ok) {
      const text = await response.text()
      lyrics.value = parseLyrics(text)
    } else {
      lyrics.value = []
    }
  } catch (error) {
    console.error('加载歌词失败:', error)
    lyrics.value = []
  }
}

// 同步歌词
const syncLyrics = () => {
  if (!lyrics.value.length) return
  
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= lyrics.value[i].time) {
      if (currentLyricIndex.value !== i) {
        currentLyricIndex.value = i
        scrollToCurrentLyric()
      }
      break
    }
  }
}

// 滚动到当前歌词
const scrollToCurrentLyric = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (!lyricsWrapper.value) return
  
  const container = lyricsWrapper.value
  const activeLine = container.querySelector('.lyric-item.active')
  
  if (activeLine && container) {
    const containerHeight = container.offsetHeight
    const lineHeight = activeLine.offsetHeight
    const lineTop = activeLine.offsetTop
    
    const targetOffset = lineTop - containerHeight / 2 + lineHeight / 2
    scrollOffset.value = -Math.max(0, targetOffset)
  }
}

// 点击歌词跳转
const seekToLyric = (time) => {
  if (audioRef.value) {
    audioRef.value.currentTime = time
    if (!isPlaying.value) {
      audioRef.value.play().catch(e => console.warn('播放失败:', e))
      isPlaying.value = true
    }
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

// 播放/暂停
const togglePlayPause = () => {
  if (audioRef.value) {
    if (isPlaying.value) {
      audioRef.value.pause()
      isPlaying.value = false
    } else {
      audioRef.value.play().catch(e => console.warn('播放失败:', e))
      isPlaying.value = true
    }
  }
}

// 格式化时间
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
    syncLyrics()
  }
}

// 处理音频结束
const handleAudioEnded = () => {
  progress.value = 0
  currentTime.value = 0
  isPlaying.value = false
  currentLyricIndex.value = -1
  scrollOffset.value = 0
}

// 返回播放器页面
const goBack = () => {
  const currentTimeVal = audioRef.value ? audioRef.value.currentTime : 0
  const isPlayingVal = isPlaying.value
  router.push(`/music?songId=${currentSong.value.id}&time=${currentTimeVal}&playing=${isPlayingVal}`)
}

// 获取当前歌曲
const getCurrentSong = (songId, startTime = 0, shouldPlay = false) => {
  const song = musicListData.find(s => s.id === parseInt(songId))
  if (song) {
    currentSong.value = song
    loadLyrics(song.lyrics)
    // 设置音频源
    if (audioRef.value) {
      audioRef.value.src = song.src
      audioRef.value.load()
      
      // 设置播放位置
      audioRef.value.currentTime = startTime
      currentTime.value = startTime
      
      // 如果之前正在播放，继续播放
      if (shouldPlay) {
        audioRef.value.play().then(() => {
          isPlaying.value = true
        }).catch(e => {
          console.warn('自动播放失败:', e)
          isPlaying.value = false
        })
      }
    }
  }
}

onMounted(() => {
  const songId = route.query.songId || 1
  const startTime = parseFloat(route.query.time) || 0
  const shouldPlay = route.query.playing === 'true'
  getCurrentSong(songId, startTime, shouldPlay)
})

watch(() => route.query.songId, (newSongId) => {
  if (newSongId) {
    getCurrentSong(newSongId)
  }
})

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
  }
})
</script>

<style scoped>
.lyrics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  padding-bottom: 120px;
  box-sizing: border-box;
}

.lyrics-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  color: white;
  font-size: 28px;
  margin: 20px 0 10px 0;
}

.artist-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 0;
}

/* 迷你播放器 */
.mini-player {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
}

.mini-progress-container {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 10px;
}

.mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.mini-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-display {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.mini-play-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
}

/* 歌词区域 */
.lyrics-content-wrapper {
  width: 100%;
  height: calc(100vh - 300px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #667eea rgba(255, 255, 255, 0.2);
}

.lyrics-content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.lyrics-content-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.lyrics-content-wrapper::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.lyrics-scroll {
  min-height: 100%;
}

.lyric-item {
  padding: 15px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lyric-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  line-height: 1.8;
  transition: all 0.3s ease;
}

.lyric-item.active .lyric-text {
  color: #667eea;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.lyric-item:hover .lyric-text {
  color: rgba(255, 255, 255, 0.8);
}

/* 底部操作 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(26, 26, 46, 0.98), transparent);
}

.action-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.02);
}

/* 音频元素 */
audio {
  display: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .lyrics-page {
    padding: 15px;
    padding-bottom: 100px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .lyric-text {
    font-size: 16px;
  }
  
  .lyric-item.active .lyric-text {
    font-size: 20px;
  }
  
  .lyrics-content-wrapper {
    height: calc(100vh - 280px);
  }
}
</style>