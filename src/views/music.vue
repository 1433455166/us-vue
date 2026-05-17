<template>
  <div class="music-container">
    <BackButton />
    <h1 class="page-title">音乐播放器</h1>
    <MusicPlayer 
      :playlist="playlist" 
      @song-change="handleSongChange"
      @play-end="handlePlayEnd"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BackButton from '../components/BackButton.vue'
import MusicPlayer from '../components/MusicPlayer.vue'

// 播放列表数据
const playlist = ref([
  {
    title: '本草纲目',
    artist: '周杰伦',
    src: '/mp3/本草纲目-周杰伦.mp3'
  }
])

// 处理歌曲切换
const handleSongChange = (song, index) => {
  console.log('当前播放:', song.title, '索引:', index)
}

// 处理播放结束
const handlePlayEnd = () => {
  console.log('播放结束')
}

// 页面加载时的初始化
onMounted(() => {
  // 可以在这里添加额外的初始化逻辑
  console.log('音乐播放器已加载')
})
</script>

<style scoped>
.music-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.page-title {
  color: white;
  text-align: center;
  margin: 20px 0 40px 0;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-container {
    padding: 10px;
  }
  
  .page-title {
    font-size: 24px;
    margin: 10px 0 30px 0;
  }
}
</style>