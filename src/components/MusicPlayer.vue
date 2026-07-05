<template>
  <div class="music-player-wrapper">
    <div class="music-player" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
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
        @error="handleAudioError"
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
      
      <!-- 当前歌词显示 -->
      <div class="current-lyric-display">
        <span class="lyric-label">正在播放：</span>
        <span class="lyric-text">{{ currentLyricText }}</span>
      </div>
      
      <!-- 操作按钮区 -->
      <div class="action-buttons">
        <button @click="toggleLyricsDrawer" class="action-btn lyrics-btn">
          📝 查看歌词
        </button>
        <button @click="togglePlaylistDrawer" class="action-btn playlist-btn">
          📋 播放列表
        </button>
      </div>
    </div>
    
    <!-- 播放列表抽屉 -->
    <div class="playlist-drawer" :class="{ open: showPlaylist }">
      <div class="drawer-mask" @click="togglePlaylistDrawer"></div>
      <div class="drawer-content">
        <div class="drawer-header">
          <h3>播放列表</h3>
          <button @click="togglePlaylistDrawer" class="close-btn">✕</button>
        </div>
        <div class="drawer-list">
          <div 
            v-for="(song, index) in playlist" 
            :key="index" 
            class="drawer-item" 
            :class="{ active: localCurrentSongIndex === index }"
            @click="playSong(index)"
          >
            <div class="item-info">
              <span class="item-title">{{ song.title }}</span>
              <span class="item-artist">{{ song.artist }}</span>
            </div>
            <span class="item-indicator" v-if="localCurrentSongIndex === index">
              {{ isPlaying ? '▶️' : '⏸️' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 歌词抽屉 -->
    <LyricsDrawer 
      :visible="showLyricsDrawer" 
      :song-id="currentSong.id"
      :audio-ref="audioRef"
      :is-playing="isPlaying"
      @close="showLyricsDrawer = false"
      @lyric-change="handleLyricChange"
      @play-state-change="handlePlayStateChange"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import LyricsDrawer from './LyricsDrawer.vue'

const router = useRouter()

// Props
const props = defineProps({
  playlist: {
    type: Array,
    default: () => []
  },
  currentSongIndex: {
    type: Number,
    default: 0
  },
  initialTime: {
    type: Number,
    default: 0
  },
  initialPlaying: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['song-change', 'play-end'])

// 音频相关
const audioRef = ref(null)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const isPlaying = ref(false)
const hasInitialized = ref(false)

// 使用props传入的索引作为当前播放索引
const localCurrentSongIndex = ref(0)

// 计算属性获取当前歌曲
const currentSong = ref({})

// 歌词相关
const lyrics = ref([])
const lyricsLoaded = ref(false)
const lyricsRef = ref(null)
const currentLyricIndex = ref(-1)
const lyricsOffset = ref(0)
const currentLyricText = ref('')

// 抽屉状态
const showPlaylist = ref(false)
const showLyricsDrawer = ref(false)

// 触摸滑动相关
const touchStartY = ref(0)
const touchCurrentY = ref(0)

// 是否有歌词
const hasLyrics = computed(() => {
  return currentSong.value && currentSong.value.lyrics
})

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
    lyricsLoaded.value = true
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
  
  lyricsLoaded.value = true
  currentLyricIndex.value = -1
}

// 同步歌词
const syncLyrics = () => {
  if (!lyrics.value.length) return
  
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= lyrics.value[i].time) {
      if (currentLyricIndex.value !== i) {
        currentLyricIndex.value = i
      }
      break
    }
  }
}

// 方案5：使用一个统一的更新函数
const updateCurrentSong = (index) => {
  if (!props.playlist || !Array.isArray(props.playlist) || props.playlist.length === 0) {
    console.log('播放列表无效，无法更新歌曲');
    return false;
  }
  
  let validIndex = index;
  if (validIndex === undefined || validIndex === null || validIndex < 0) {
    validIndex = 0;
  }
  if (validIndex >= props.playlist.length) {
    validIndex = 0;
  }
  
  if (validIndex === localCurrentSongIndex.value && currentSong.value.title) {
    console.log('索引相同，跳过更新');
    return false;
  }
  
  console.log('更新歌曲索引:', validIndex);
  localCurrentSongIndex.value = validIndex;
  currentSong.value = props.playlist[validIndex];
  
  // 加载歌词
  lyricsLoaded.value = false
  loadLyrics(currentSong.value.lyrics)
  
  nextTick(() => {
    if (currentSong.value) {
      attemptPlay(currentSong.value, validIndex);
    }
  });
  
  return true;
};

// 初始化播放状态
const initializePlayer = () => {
  if (hasInitialized.value) return
  
  hasInitialized.value = true
  
  // 如果有初始播放时间，设置播放位置
  if (props.initialTime > 0 && audioRef.value) {
    audioRef.value.currentTime = props.initialTime
    currentTime.value = props.initialTime
  }
  
  // 如果需要自动播放
  if (props.initialPlaying && audioRef.value) {
    audioRef.value.play().then(() => {
      isPlaying.value = true
    }).catch(e => {
      console.warn('自动播放失败:', e)
    })
  }
}

// 添加初始化钩子
watch(() => currentSong.value.title, (title) => {
  if (title && !hasInitialized.value) {
    nextTick(() => {
      initializePlayer()
    })
  }
})

// 监听 playlist 变化
watch(
  () => props.playlist,
  (newPlaylist) => {
    console.log('playlist 更新:', newPlaylist?.length);
    if (newPlaylist && newPlaylist.length > 0) {
      updateCurrentSong(props.currentSongIndex);
    }
  },
  { immediate: true }
);

// 监听 currentSongIndex 变化
watch(
  () => props.currentSongIndex,
  (newIndex) => {
    console.log('currentSongIndex 更新:', newIndex);
    updateCurrentSong(newIndex);
  },
  { immediate: true }
);

// 辅助函数：尝试播放音频并处理状态
const attemptPlay = (song, index) => {
  if (!audioRef.value) return

  console.log('尝试播放:', song.title, 'Src:', song.src)
  console.log('音频元素状态 - ReadyState:', audioRef.value.readyState, 'NetworkState:', audioRef.value.networkState)

  if (audioRef.value.src !== song.src) {
    audioRef.value.src = song.src
    audioRef.value.load()
    console.log('重新加载音频源:', song.src)
  }

  setTimeout(() => {
    if (!audioRef.value) return
    
    console.log('播放前最终检查 - ReadyState:', audioRef.value.readyState, 'NetworkState:', audioRef.value.networkState)

    try {
      const playPromise = audioRef.value.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('播放成功:', song.title)
            isPlaying.value = true
            emit('song-change', song, index)
          })
          .catch((error) => {
            console.warn('播放失败或被阻止:', error.name, error.message)
            isPlaying.value = false
            emit('song-change', song, index)
          })
      } else {
        console.log('播放开始 (无 Promise):', song.title)
        isPlaying.value = true
        emit('song-change', song, index)
      }
    } catch (error) {
      console.error('播放调用异常:', error)
      isPlaying.value = false
      emit('song-change', song, index)
    }
  }, 50)
}

watch(() => localCurrentSongIndex.value, (newIndex) => {
  if (props.playlist && props.playlist.length > 0) {
    currentSong.value = props.playlist[newIndex] || props.playlist[0]
  }
})

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
    syncLyrics()
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
  currentLyricIndex.value = -1
  lyricsOffset.value = 0
  emit('play-end')
  
  if (props.playlist.length > 1) {
    const nextIndex = (localCurrentSongIndex.value + 1) % props.playlist.length
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

// 点击歌词跳转到对应时间
const seekToLyric = (time) => {
  if (audioRef.value) {
    audioRef.value.currentTime = time
    if (!isPlaying.value) {
      audioRef.value.play().catch(e => {
        console.warn('播放失败:', e)
      })
      isPlaying.value = true
    }
  }
}

// 播放指定歌曲
const playSong = (index) => {
  if (index >= 0 && index < props.playlist.length) {
    console.log('用户点击播放歌曲索引:', index)
    localCurrentSongIndex.value = index
    const song = props.playlist[index]
    
    currentSong.value = song

    lyricsLoaded.value = false
    loadLyrics(song.lyrics)

    nextTick(() => {
      attemptPlay(song, index)
    })
    
    // 关闭抽屉
    showPlaylist.value = false
  }
}

// 处理音频错误
const handleAudioError = (event) => {
  console.error('音频播放错误:', event)
  console.error('错误代码:', audioRef.value?.error?.code)
  console.error('错误消息:', audioRef.value?.error?.message)
  isPlaying.value = false
}

// 切换歌词抽屉
const toggleLyricsDrawer = () => {
  showLyricsDrawer.value = !showLyricsDrawer.value
}

// 处理歌词变化
const handleLyricChange = (data) => {
  console.log('歌词变化:', data.lyric.text)
  // 更新外部显示的当前歌词
  currentLyricText.value = data.lyric.text
}

// 处理播放状态变化
const handlePlayStateChange = (playing) => {
  isPlaying.value = playing
}

// 切换播放列表抽屉
const togglePlaylistDrawer = () => {
  showPlaylist.value = !showPlaylist.value
}

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  touchCurrentY.value = e.touches[0].clientY
}

const handleTouchEnd = () => {
  const diff = touchStartY.value - touchCurrentY.value
  // 可以在这里添加滑动逻辑
  console.log('滑动距离:', diff)
}
</script>

<style scoped>
.music-player-wrapper {
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.music-player {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  touch-action: pan-y;
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
  font-size: 28px;
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

.play-btn {
  font-size: 60px;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
}

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

/* 当前歌词显示 */
.current-lyric-display {
  text-align: center;
  padding: 18lpx;
  margin-bottom: 15px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  min-height: 44lpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.lyric-label {
  color: rgba(0, 0, 0, 0.88);
  font-size: 24lpx;
}

.lyric-text {
  color: #000;
  font-size: 27lpx;
  font-weight: 500;
  max-width: 72%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮区 */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.action-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* 播放列表抽屉 */
.playlist-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

.playlist-drawer.open {
  pointer-events: auto;
}

.drawer-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.playlist-drawer.open .drawer-mask {
  opacity: 1;
}

.drawer-content {
  position: absolute;
  bottom: -72%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  max-height: 60%;
  overflow: hidden;
  transition: bottom 0.3s ease;
}

.playlist-drawer.open .drawer-content {
  bottom: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
}

.drawer-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.drawer-list {
  padding: 10px;
  max-height: calc(60vh - 70px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.drawer-item:hover {
  background: #f8f9fa;
}

.drawer-item.active {
  background: #f0f4ff;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: 600;
  color: #2c3e50;
}

.item-artist {
  font-size: 14px;
  color: #888;
}

.item-indicator {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-player-wrapper {
    padding: 10px;
  }
  
  .music-player {
    padding: 20px;
    margin: 0;
    border-radius: 12px;
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
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    padding: 15px;
  }
  
  .drawer-content {
    max-height: 70%;
  }
  
  .drawer-list {
    max-height: calc(70vh - 70px);
  }
}
</style>