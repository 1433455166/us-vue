<template>
  <div class="music-container">
    <PasswordGuard v-if="!isAuthenticated" @success="handleAuthSuccess" />
    <template v-else>
      <BackButton />
      <h1 class="page-title">音乐播放器</h1>
      <MusicPlayer 
        :playlist="playlist" 
        :current-song-index="currentSongIndex"
        @song-change="handleSongChange"
        @play-end="handlePlayEnd"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BackButton from '../components/BackButton.vue'
import MusicPlayer from '../components/MusicPlayer.vue'
import PasswordGuard from '../components/PasswordGuard.vue'
import Cookies from 'js-cookie'
import { accessPassword } from '../common/const'
import musicListData from '../data/musicList.json'

// 认证状态
const isAuthenticated = ref(false)

// 路由
const route = useRoute()

// 处理认证成功
const handleAuthSuccess = () => {
  isAuthenticated.value = true
}

// 播放列表数据 - 从 JSON 文件导入
const playlist = ref(musicListData)

// 当前播放索引
const currentSongIndex = ref(0)

// 处理歌曲切换
const handleSongChange = (song, index) => {
  console.log('当前播放:', song.title, '索引:', index)
  currentSongIndex.value = index
}

// 处理播放结束
const handlePlayEnd = () => {
  console.log('播放结束')
}

// 监听路由参数变化
watch(() => route.query.songId, (newSongId) => {
  if (newSongId && playlist.value && playlist.value.length > 0) {
    const index = playlist.value.findIndex(song => song.id === parseInt(newSongId))
    if (index !== -1) {
      currentSongIndex.value = index
      console.log('设置当前播放歌曲索引:', index)
    }
  }
}, { immediate: true })

// 页面加载时的初始化
onMounted(() => {
  // 检查cookie中是否有有效的访问密码
  const storedPassword = Cookies.get('accessPassword')
  if (storedPassword && storedPassword === accessPassword) {
    isAuthenticated.value = true
  }
  
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
