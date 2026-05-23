<template>
  <div class="app">
    <PasswordGuard v-if="!isAuthenticated" @success="handleAuthSuccess" />
    <template v-else>
      <header class='header'>
          <div class="width-300">
              <h1>小说</h1>
          </div>
      </header>

      <main class="main-content">
        <NovelCard
          v-for="(item, index) in cards"
          :key="index"
          :title="item.title"
          :content="item.content"
          :bgImage="item.bgImage"
        />
      </main>
    </template>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import NovelCard from '../components/NovelCard.vue'
import PasswordGuard from '../components/PasswordGuard.vue'
import Cookies from 'js-cookie'
import { accessPassword } from '../common/const'

// 认证状态
const isAuthenticated = ref(false)

// 卡片数据
// 个人喜爱的小说，个人阅读用，侵权联系删除
const cards = ref([
  { title: '三体', bgImage: '../../public/images/novel/trisomy001.jpg' },
  { title: '卡片2' },
  { title: '卡片3' },
  { title: '卡片4' },
])

// 处理认证成功
const handleAuthSuccess = () => {
  isAuthenticated.value = true
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
.app {
  min-height: 100vh;
  background-color: #f7f9fc;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  margin: 0;
  padding: 0;
}

.header {
  text-align: center;
  padding: 1rem 1rem;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
}

.device-info {
  font-size: 1rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.main-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18lpx;
  padding: 24lpx 12lpx;
  margin: 0 auto;
}
</style>
