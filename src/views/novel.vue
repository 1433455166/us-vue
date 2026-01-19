<template>
  <div class="app">
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
  </div>
</template>


<script setup>
import { ref } from 'vue'
import NovelCard from '../components/NovelCard.vue'

// 卡片数据
// 个人喜爱的小说，个人阅读用，侵权联系删除
const cards = ref([
  { title: '三体', bgImage: '../../public/images/novel/trisomy001.jpg' },
  { title: '卡片2' },
  { title: '卡片3' },
  { title: '卡片4' },
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
  gap: 18lpx;
  padding: 24lpx 12lpx;
  margin: 0 auto;
}
</style>