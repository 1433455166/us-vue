<template>
  <div class="music-list-page">
    <PasswordGuard v-if="!isAuthenticated" @success="handleAuthSuccess" />
    <template v-else>
      <BackButton />
      <MusicList 
        :music-list="musicList" 
        @play-song="handlePlaySong"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BackButton from '../components/BackButton.vue'
import MusicList from '../components/MusicList.vue'
import PasswordGuard from '../components/PasswordGuard.vue'
import Cookies from 'js-cookie'
import { accessPassword } from '../common/const'
import musicListData from '../data/musicList.json'

// 认证状态
const isAuthenticated = ref(false)

// 处理认证成功
const handleAuthSuccess = () => {
  isAuthenticated.value = true
}

// 音乐列表数据 - 从 JSON 文件导入
const musicList = ref(musicListData)

const router = useRouter()

// 处理播放歌曲 - 跳转到音乐播放页面
const handlePlaySong = (song) => {
  console.log('播放歌曲:', song.title)
  // 跳转到音乐播放页面，传递歌曲ID
  router.push({ path: '/music', query: { songId: song.id } })
}

// 页面加载时检查cookie
onMounted(() => {
  const storedPassword = Cookies.get('accessPassword')
  if (storedPassword && storedPassword === accessPassword) {
    isAuthenticated.value = true
  }
})
</script>

<style scoped>
.music-list-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-list-page {
    padding: 0;
  }
}
</style>
