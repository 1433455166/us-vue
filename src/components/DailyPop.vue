<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content" v-for="value in list" :style="contentStyle">{{ value }}</p>
  </div>
  <Loading v-if="loading" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { lpxToVw } from '../utils/lpx';
import Loading from './Loading/default.vue';

// 接收弹窗数据作为prop
const props = defineProps({
  dailyData: Object
})

// 响应式数据
const loading = ref(true)
const title = ref('')
const list = ref([])
const contentStyle = ref({
  fontSize: lpxToVw(24),
  lineHeight: 1.6,
})

// 处理传入的数据
const processDailyData = (data) => {
  if (data) {
    title.value = data.title || '';
    list.value = data.data || [];
    if (data.style) {
      contentStyle.value = {
        ...contentStyle.value,
        ...data.style,
        fontSize: lpxToVw(data.style.fontSize) || lpxToVw(contentStyle.value.fontSize),
        lineHeight: data.style.lineHeight || contentStyle.value.lineHeight
      };
    }
    console.log('dailyData', data);
  }
  loading.value = false
}

// 监听props变化
watch(() => props.dailyData, (newData) => {
  if (newData) {
    processDailyData(newData)
  }
}, { immediate: true })
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