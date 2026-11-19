<!-- src/views/gameList.vue -->
<template>
  <div class="game-list-page">
    <PasswordGuard v-if="!isAuthenticated" @success="handleAuthSuccess" />
    <template v-else>
      <BackButton />
      <h2 class="page-title">🎮 游戏列表</h2>
      <main class="game-cards">
        <DeviceCard
          v-for="game in games"
          :key="game.path"
          :title="game.title"
          :content="game.content"
          @click="router.push(game.path)"
        />
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BackButton from '../components/BackButton.vue'
import DeviceCard from '../components/DeviceCard.vue'
import PasswordGuard from '../components/PasswordGuard.vue'
import Cookies from 'js-cookie'
import { getPasswordLevel, PASSWORD_LEVEL } from '../common/const'

// 认证状态
const isAuthenticated = ref(false)

// 处理认证成功
const handleAuthSuccess = () => {
  isAuthenticated.value = true
}

const router = useRouter()

// 游戏列表数据，对应 src/views/game 下的游戏页面
const games = [
  { title: '九九乘法表', content: '点击进入九九乘法表小游戏', path: '/game/multiplicationTable' },
  { title: '五子棋', content: '点击进入五子棋小游戏', path: '/game/gomoku' }
]

// 页面加载时检查cookie
onMounted(() => {
  const storedPassword = Cookies.get('accessPassword')
  if (getPasswordLevel(storedPassword) > PASSWORD_LEVEL.GUEST) {
    isAuthenticated.value = true
  }
})
</script>

<style scoped>
.game-list-page {
  min-height: 100vh;
  background-color: #f7f9fc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.page-title {
  margin: 1.5rem 0;
  font-size: 1.6rem;
}

.game-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
}

/* 桌面端布局 */
@media (min-width: 1024px) {
  .game-cards {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
