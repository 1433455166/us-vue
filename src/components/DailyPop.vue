<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content" v-for="value in list" :style="contentStyle">{{ value }}</p>
  </div>
  <Loading v-if="loading" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPopDailyV2 } from "../utils/api";
import { lpxToVw } from '../utils/lpx';
import Loading from './Loading/default.vue';

// 响应式数据
const loading = ref(true)
const title = ref('')
const list = ref([])
const contentStyle = ref({
  fontSize: lpxToVw(24),
  lineHeight: 1.6,
})

// 加载数据
const loadDailyData = async () => {
  loading.value = true

  try {
    // 调用新的 pop.daily.v2 接口
    const res = await getPopDailyV2();
    console.log("pop.daily.v2 response", res);
    
    if (res?.success && res?.data) {
      const dailyData = res.data.dailyData;
      
      if (dailyData) {
        // 使用API返回的数据
        title.value = dailyData.title || '';
        list.value = dailyData.data || [];
        if (dailyData.style) {
          contentStyle.value = {
            ...contentStyle.value,
            ...dailyData.style,
            fontSize: lpxToVw(dailyData.style.fontSize) || lpxToVw(contentStyle.value.fontSize),
            lineHeight: dailyData.style.lineHeight || contentStyle.value.lineHeight
          };
        }
        console.log('dailyData', dailyData);
      }
    }
  } catch (err) {
    console.error('加载数据失败:', err);
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