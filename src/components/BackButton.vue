<template>
  <div class="back-button" @click="goBack">
    ←
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  // 尝试返回上一页，如果历史记录为空则跳转到首页
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/index')
  }
}
</script>

<style scoped>
.back-button {
  position: absolute;
  top: 8px;
  left: 15px;
  color: #007bff;
  cursor: pointer;
  font-weight: bold;
  padding: 6px 16px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  font-size: 14px;
}

.back-button:hover {
  background-color: rgba(248, 249, 250, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #0056b3;
}
</style>