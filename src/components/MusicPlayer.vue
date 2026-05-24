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
    
    <div class="playlist" v-if="playlist.length > 1">
      <h3>播放列表</h3>
      <ul>
        <li 
          v-for="(song, index) in playlist" 
          :key="index" 
          class="playlist-item" 
          :class="{ active: localCurrentSongIndex === index }"
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
import { ref, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  playlist: {
    type: Array,
    default: () => []
  },
  currentSongIndex: {
    type: Number,
    default: 0
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

// 使用props传入的索引作为当前播放索引
const localCurrentSongIndex = ref(0) // 初始化为0

// 计算属性获取当前歌曲
const currentSong = ref({})  // 初始化为空对象

// 方案5：使用一个统一的更新函数
const updateCurrentSong = (index) => {
  if (!props.playlist || !Array.isArray(props.playlist) || props.playlist.length === 0) {
    console.log('播放列表无效，无法更新歌曲');
    return false;
  }
  
  // 确保索引有效
  let validIndex = index;
  if (validIndex === undefined || validIndex === null || validIndex < 0) {
    validIndex = 0;
  }
  if (validIndex >= props.playlist.length) {
    validIndex = 0;
  }
  
  // 避免重复更新
  if (validIndex === localCurrentSongIndex.value && currentSong.value.title) {
    console.log('索引相同，跳过更新');
    return false;
  }
  
  console.log('更新歌曲索引:', validIndex);
  localCurrentSongIndex.value = validIndex;
  currentSong.value = props.playlist[validIndex];
  
  nextTick(() => {
    if (currentSong.value) {
      attemptPlay(currentSong.value, validIndex);
    }
  });
  
  return true;
};

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

  // 确保 src 已设置
  if (audioRef.value.src !== song.src) {
    audioRef.value.src = song.src
    audioRef.value.load()
    console.log('重新加载音频源:', song.src)
  }

  // 稍微延迟以确保 load() 启动
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
            // 即使播放失败，也通知父组件歌曲已切换（但可能未播放）
            emit('song-change', song, index)
          })
      } else {
        // 兼容旧浏览器
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

// 播放指定歌曲
const playSong = (index) => {
  if (index >= 0 && index < props.playlist.length) {
    console.log('用户点击播放歌曲索引:', index)
    localCurrentSongIndex.value = index
    const song = props.playlist[index]
    
    // 更新当前歌曲引用
    currentSong.value = song

    // 使用统一的播放尝试逻辑
    nextTick(() => {
      attemptPlay(song, index)
    })
  }
}

// 处理音频错误
const handleAudioError = (event) => {
  console.error('音频播放错误:', event)
  console.error('错误代码:', audioRef.value?.error?.code)
  console.error('错误消息:', audioRef.value?.error?.message)
  isPlaying.value = false
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
  padding: 10px;
  border-radius: 10px;
  /* border-bottom: 1px solid #f0f0f0; */
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background-color: #f8f9fa;
  /* transform: translateX(5px); */
}

.playlist-item.active {
  color: #667eea;
  font-weight: bold;
  background-color: #f0f4ff;
}

.song-title {
  font-weight: 500;
  color: #888;
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