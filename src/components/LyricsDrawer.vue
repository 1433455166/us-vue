<template>
  <div class="lyrics-drawer" :class="{ 'show': visible, 'fullscreen': isFullscreen }">
    <!-- 遮罩层 -->
    <div class="drawer-overlay" @click="closeDrawer"></div>
    
    <!-- 抽屉内容 -->
    <div class="drawer-content" :class="{ 'fullscreen': isFullscreen }">
      <!-- 抽屉头部 -->
      <div class="drawer-header">
        <div class="song-info">
          <h3 class="song-title">{{ currentSong?.title || '歌词' }}</h3>
          <p class="song-artist">{{ currentSong?.artist || '' }}</p>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
            <span>{{ isFullscreen ? '▢' : '⛶' }}</span>
          </button>
          <button class="close-btn" @click="closeDrawer">
            <span class="icon">✕</span>
          </button>
        </div>
      </div>
      
      <!-- 迷你播放器 -->
      <div class="mini-player">
        <div class="mini-progress-container" @click="handleProgressClick">
          <div class="mini-progress-bar" :style="{ width: progress + '%' }"></div>
          <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
        </div>
        <div class="mini-controls">
          <span class="time-display">{{ formatTime(currentTime) }}</span>
          <button class="mini-play-btn" @click="togglePlay">
            <span>{{ props.isPlaying ? '⏸' : '▶' }}</span>
          </button>
          <span class="time-display">{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <!-- 歌词区域 -->
      <div ref="lyricsContainer" class="lyrics-content-wrapper" @scroll="handleManualScroll">
        <div ref="lyricsScroll" class="lyrics-scroll">
          <div 
            v-for="(lyric, index) in lyrics" 
            :key="index"
            ref="lyricItems"
            class="lyric-item"
            :class="{ 'active': index === currentLyricIndex, 'played': index < currentLyricIndex }"
            @click="seekToLyric(lyric.time)"
          >
            {{ lyric.text }}
          </div>
          <div v-if="lyrics.length === 0" class="no-lyrics">
            暂无歌词
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import musicListData from '../data/musicList.json';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  songId: {
    type: Number,
    default: null
  },
  audioRef: {
    type: Object,
    default: null
  },
  isPlaying: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'lyric-change', 'play-state-change']);

// 当前歌曲
const currentSong = ref({});

// 歌词数据
const lyrics = ref([]);
const currentLyricIndex = ref(-1);
const lyricsContainer = ref(null);
const lyricsScroll = ref(null);

// 播放状态（时间和进度）
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);

// 全屏状态
const isFullscreen = ref(false);

// 防抖计时器
let scrollDebounceTimer = null;

// 解析歌词
const parseLyrics = (text) => {
  const lines = text.split('\n');
  const parsedLyrics = [];
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = match[3] ? parseInt(match[3]) / 1000 : 0;
      parsedLyrics.push({
        time: minutes * 60 + seconds + milliseconds,
        text: match[4].trim()
      });
    }
  }
  return parsedLyrics.sort((a, b) => a.time - b.time);
};

// 加载歌词
const loadLyrics = async (lyricsPath) => {
  if (!lyricsPath) {
    lyrics.value = [];
    return;
  }
  try {
    const response = await fetch(lyricsPath);
    if (!response.ok) {
      lyrics.value = [];
      return;
    }
    const text = await response.text();
    lyrics.value = parseLyrics(text);
  } catch (error) {
    console.error('加载歌词失败:', error);
    lyrics.value = [];
  }
};

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 同步歌词并滚动
const syncLyrics = () => {
  if (lyrics.value.length === 0) return;
  
  let foundIndex = -1;
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime.value >= lyrics.value[i].time) {
      foundIndex = i;
      break;
    }
  }
  
  if (foundIndex !== -1 && currentLyricIndex.value !== foundIndex) {
    currentLyricIndex.value = foundIndex;
    // 通知父组件歌词变化
    emit('lyric-change', {
      index: foundIndex,
      lyric: lyrics.value[foundIndex]
    });
    // 歌词更新时触发滚动（受防抖影响）
    scrollToCurrentLyric();
  }
};

// 滚动到当前歌词
const scrollToCurrentLyric = () => {
  // 如果有防抖计时器在运行，说明用户正在手动滚动，跳过这次自动滚动
  if (scrollDebounceTimer) return;
  
  nextTick(() => {
    if (!lyricsContainer.value || currentLyricIndex.value < 0) return;
    
    const lyricElements = lyricsContainer.value.querySelectorAll('.lyric-item');
    if (!lyricElements.length) return;
    
    const currentElement = lyricElements[currentLyricIndex.value];
    if (!currentElement) return;
    
    const containerHeight = lyricsContainer.value.offsetHeight;
    const currentTop = currentElement.offsetTop;
    const currentBottom = currentTop + currentElement.offsetHeight;
    const currentScrollTop = lyricsContainer.value.scrollTop;
    const visibleTop = currentScrollTop;
    const visibleBottom = currentScrollTop + containerHeight;
    
    // 计算目标滚动位置：让当前歌词显示在容器底部附近
    const targetScrollTop = currentTop - containerHeight + currentElement.offsetHeight + 20;
    
    // 检查当前歌词是否在可视区域内
    const isInView = currentTop >= visibleTop - 30 && currentBottom <= visibleBottom + 30;
    
    // 如果当前歌词不在可视区域内，滚动到目标位置
    if (!isInView) {
      lyricsContainer.value.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  });
};

// 用户手动滚动时调用
const handleManualScroll = () => {
  // 清除之前的计时器
  if (scrollDebounceTimer) {
    clearTimeout(scrollDebounceTimer);
  }
  
  // 设置新的计时器，3秒后恢复自动滚动
  scrollDebounceTimer = setTimeout(() => {
    scrollDebounceTimer = null;
    // 3秒后自动滚动到当前歌词
    scrollToCurrentLyric();
  }, 3000);
};

// 点击歌词跳转
const seekToLyric = (time) => {
  if (props.audioRef) {
    props.audioRef.currentTime = time;
    currentTime.value = time;
    
    // 找到对应的歌词索引
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (time >= lyrics.value[i].time) {
        currentLyricIndex.value = i;
        break;
      }
    }
    
    if (!props.isPlaying) {
      props.audioRef.play().then(() => {
        emit('play-state-change', true);
      }).catch(e => {
        console.warn('播放失败:', e);
      });
    }
  }
};

// 切换播放
const togglePlay = () => {
  if (props.audioRef) {
    if (props.isPlaying) {
      props.audioRef.pause();
      emit('play-state-change', false);
    } else {
      props.audioRef.play().then(() => {
        emit('play-state-change', true);
      }).catch(e => {
        console.warn('播放失败:', e);
      });
    }
  }
};

// 进度条点击
const handleProgressClick = (e) => {
  if (props.audioRef && duration.value > 0) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration.value;
    props.audioRef.currentTime = newTime;
    currentTime.value = newTime;
    progress.value = percent * 100;
    
    // 更新歌词索引
    for (let i = lyrics.value.length - 1; i >= 0; i--) {
      if (newTime >= lyrics.value[i].time) {
        currentLyricIndex.value = i;
        scrollToCurrentLyric();
        break;
      }
    }
  }
};

// 更新进度
const updateProgress = () => {
  if (props.audioRef) {
    currentTime.value = props.audioRef.currentTime;
    duration.value = props.audioRef.duration || 0;
    progress.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
    syncLyrics();
  }
};

// 获取当前歌曲
const getCurrentSong = (songId) => {
  const song = musicListData.find(s => s.id === parseInt(songId));
  if (song) {
    currentSong.value = song;
    loadLyrics(song.lyrics);
    // 重置状态
    currentLyricIndex.value = -1;
    currentTime.value = 0;
    progress.value = 0;
    if (props.audioRef) {
      duration.value = props.audioRef.duration || 0;
    }
  }
};

// 关闭抽屉
const closeDrawer = () => {
  isFullscreen.value = false;
  emit('close');
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 监听全屏变化，需要重新滚动
watch(isFullscreen, () => {
  if (currentLyricIndex.value >= 0) {
    nextTick(() => {
      scrollToCurrentLyric();
    });
  }
});

// 添加音频事件监听
const addAudioListeners = () => {
  if (props.audioRef) {
    props.audioRef.addEventListener('timeupdate', updateProgress);
    props.audioRef.addEventListener('loadedmetadata', onLoadedMetadata);
    updateProgress();
  }
};

// 移除音频事件监听
const removeAudioListeners = () => {
  if (props.audioRef) {
    props.audioRef.removeEventListener('timeupdate', updateProgress);
    props.audioRef.removeEventListener('loadedmetadata', onLoadedMetadata);
  }
};

// 音频加载完成
const onLoadedMetadata = () => {
  if (props.audioRef) {
    duration.value = props.audioRef.duration;
  }
};

// 设置音频事件监听
onMounted(() => {
  addAudioListeners();
});

onUnmounted(() => {
  removeAudioListeners();
});

// 监听 audioRef 变化
watch(() => props.audioRef, (newAudio, oldAudio) => {
  if (oldAudio) {
    removeAudioListeners();
  }
  if (newAudio) {
    addAudioListeners();
  }
});

// 监听 visible 变化，确保显示时更新状态
watch(() => props.visible, (newVal) => {
  if (newVal && props.songId) {
    getCurrentSong(props.songId);
    // 确保音频状态同步
    nextTick(() => {
      updateProgress();
    });
  }
});
</script>

<style scoped>
.lyrics-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

.lyrics-drawer.show {
  pointer-events: auto;
}

.drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lyrics-drawer.show .drawer-overlay {
  opacity: 1;
}

.drawer-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.lyrics-drawer.show .drawer-content {
  transform: translateY(0);
}

/* 全屏模式 */
.lyrics-drawer.fullscreen .drawer-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0;
  max-height: 100vh;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.song-info {
  flex: 1;
}

.song-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px 0;
}

.song-artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  color: white;
  font-size: 16px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn .icon {
  color: white;
  font-size: 18px;
}

.mini-player {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.mini-progress-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 12px;
  position: relative;
}

.mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.mini-progress-container:hover .progress-thumb {
  opacity: 1;
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
  background: linear-gradient(90deg, #667eea, #764ba2);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  color: white;
  font-size: 18px;
}

.mini-play-btn:hover {
  transform: scale(1.1);
}

/* 歌词区域 */
.lyrics-content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
  -webkit-overflow-scrolling: touch;
}

.lyrics-content-wrapper::-webkit-scrollbar {
  width: 4px;
}

.lyrics-content-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.lyrics-content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.lyrics-scroll {
  min-height: 100%;
}

.lyric-item {
  padding: 16lpx 24lpx;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 27lpx;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  line-height: 1.6;
}

.lyric-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.lyric-item.active {
  color: #fff;
  font-size: 32lpx; /* 最大值 */
  font-weight: 600;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4));
  transform: scale(1.02);
}

.lyric-item.played {
  color: rgba(255, 255, 255, 0.3);
  background: none !important;
  transform: scale(1) !important;
  font-size: 27lpx !important;
  font-weight: normal !important;
}

.no-lyrics {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  padding: 40px;
}

/* 全屏模式下歌词更大 */
.lyrics-drawer.fullscreen .lyric-item {
  padding: 24lpx;
  font-size: 27lpx;
}

.lyrics-drawer.fullscreen .lyric-item.active {
  font-size: 32lpx;
}
</style>