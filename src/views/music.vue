<template>
  <div class="music-container">
    <PasswordGuard v-if="!isAuthenticated" @success="handleAuthSuccess" />
    <template v-else>
      <BackButton class="music-back" />
      <MusicPlayer
        :songs="playlist"
        :initial-index="currentSongIndex"
        :auto-play="initialPlaying"
        @song-change="handleSongChange"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import MusicPlayer from '../components/MusicPlayer.vue'
import BackButton from '../components/BackButton.vue'
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

// 初始播放状态
const initialPlaying = computed(() => route.query.playing === 'true')

// 处理歌曲切换
const handleSongChange = (song, index) => {
  console.log('当前播放:', song.title, '索引:', index)
  currentSongIndex.value = index
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

  console.log('音乐播放器已加载')
})
</script>

<style scoped>
.music-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}

/* 返回按钮置顶，避免被播放器遮挡 */
.music-container :deep(.music-back) {
  position: fixed;
  top: 12px;
  left: 14px;
  z-index: 100;
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
}
</style>