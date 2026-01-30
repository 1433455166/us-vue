<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content" v-for="value in list" :style="contentStyle">{{ value }}</p>
  </div>
  <Loading v-if="loading" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPopDaily } from "../utils/api";
import { lpxToVw } from '../utils/lpx';
import Loading from './Loading/default.vue';

// 响应式数据
const loading = ref(true)
const error = ref(false)
const title = ref(null)
const list = ref([])
const contentStyle = ref({
  fontSize: lpxToVw(24),
  lineHeight: 1.6,
})

// 加载数据
const loadDailyData = async () => {
  loading.value = true
  error.value = false

  // 0 - 2 随机取值
  const randomNumber = Math.ceil(Math.random() * 3 - 1)
  
  try {
    // 尝试从API获取弹窗数据
    const res = await getPopDaily();
    const dailyData = res?.data || {};
    if (res?.success) {
      // 使用API返回的数据
      const dailyItem = dailyData.list[randomNumber] || {};
      title.value = dailyItem.title
      list.value = dailyItem.data
      contentStyle.value = {
        ...contentStyle.value,
        ...dailyItem.style,
        fontSize: lpxToVw(dailyItem.style.fontSize) || lpxToVw(contentStyle.value.fontSize)
      }
      console.log('dailyItem', dailyItem);
    } else {
      // 回退到本地JSON数据
      console.warn('API返回数据异常')
    }
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
    loadDailyData() // 页面加载时获取数据
})
</script>

<style scoped>
.card {
  border-radius: 12px;
  padding: 24lpx;
  width: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-title {
  margin: 0 0 0.8rem;
  color: #e5dec5;
  font-size: 1.2rem;
}

.card-content {
  color: #b9e8e8;
  line-height: 1.6;
  margin: 0;
  font-size: 24lpx;
}
</style>