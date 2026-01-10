<template>
  <div class="app">
    <header class='header'>
        <div class="width-300">
            <h1>这是一个 vue 项目</h1>
        </div>
    </header>

    <main class="main-content">
      <DeviceCard
        v-for="(item, index) in cards"
        :key="index"
        :title="item.title"
        :content="item.content"
      />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DeviceCard from '../components/DeviceCard.vue'

// 卡片数据
const cards = ref([
  { title: '卡片1', content: '卡片1 内容' },
  { title: '卡片2', content: '卡片2 内容' }
])
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
  gap: 1.5rem;
  padding: 1rem;
  margin: 0 auto;
}
</style>