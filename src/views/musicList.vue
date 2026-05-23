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

// 认证状态
const isAuthenticated = ref(false)

// 处理认证成功
const handleAuthSuccess = () => {
  isAuthenticated.value = true
}

// 音乐列表数据 - 目前只有一个音乐文件，但结构支持扩展
const musicList = ref([
  {
    id: 1,
    title: '本草纲目',
    artist: '周杰伦',
    src: '/mp3/本草纲目-周杰伦.mp3',
    duration: '4:20' // 可选：歌曲时长
  }
])

const router = useRouter()

// 处理播放歌曲 - 跳转到音乐播放页面
const handlePlaySong = (song) => {
  console.log('播放歌曲:', song.title)
  // 跳转到音乐播放页面，传递歌曲信息
  // 由于当前音乐播放页面是固定的，我们可以先跳转到 /music
  // 后续可以扩展为传递歌曲ID或信息
  router.push('/music')
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
    padding: 10px;
  }
}
</style>
