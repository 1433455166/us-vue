<template>
  <div class="app">
    <header class='header'>
        <div class="width-300">
            <h1>这是一个 vue 项目</h1>
            <div class="clock">{{ currentTime }}</div>
        </div>
    </header>

    <main class="main-content">
      <DeviceCard
        v-for="(item, index) in cards"
        :key="index"
        :title="item.title"
        :content="item.content"
        @click="handleCardClick(item)"
      />
    </main>
    <BaseModal
        v-model="showModal"
        ref="baseModalRef"
        title="基础提示"
        :animation="true"
        animation-type="zoom"
        @confirm="handleConfirm"
    >
        <DailyPop v-if="showModal" />
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { CARD_TYPE } from '../common/enum'
import { getPopDailyV2 } from '../utils/api'
import DeviceCard from '../components/DeviceCard.vue'
import DailyPop from '../components/DailyPop.vue'
import BaseModal from '../components/Modal/BaseModal.vue';

// 卡片数据
const cards = ref([
  { title: '弹窗测试', content: '点击弹出一个测试弹窗, 已弃用' },
  { title: '小说', content: '点击跳转小说页面', type: CARD_TYPE.novel },
  { title: '卡片3', content: '卡片3 内容' },
])

const showModal = ref(false);
const baseModalRef = ref(null);
const router = useRouter();

// 时钟相关
const currentTime = ref('')
let timer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const checkAndShowDailyPop = async () => {
  try {
    const res = await getPopDailyV2();
    console.log("pop.daily.v2 response for check", res);
    
    if (res?.success && res?.data) {
      const hasShownToday = res.data.hasShownToday;
      // 只有当今日未显示过时才打开弹窗
      if (!hasShownToday) {
        showModal.value = true;
      }
    }
  } catch (err) {
    console.error('检查弹窗显示状态失败:', err);
    // 如果检查失败，也不显示弹窗
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  
  // 检查并决定是否显示弹窗
  checkAndShowDailyPop()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const handleCardClick = (data) => {
  if (data?.type === CARD_TYPE.novel) {
    router.push('/bookList')
  }
}

const handleConfirm = () => {
    showModal.value = false;
    console.log('确认操作');
}
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

.clock {
  margin-top: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
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
  gap: 1.5rem;
  padding: 1rem;
  margin: 0 auto;
}
</style>