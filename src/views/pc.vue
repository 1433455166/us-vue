<template>
  <div class="pc-page">
    <div class="pc-card">
      <div class="pc-icon">🖥️</div>
      <h1 class="pc-title">PC 端页面</h1>
      <p class="pc-desc">检测到您正在使用电脑浏览器访问</p>
      <p class="pc-tip">本站内容主要面向移动端设备，建议使用手机浏览器访问获得最佳体验</p>
      <div class="pc-meta">
        <p>当前时间：{{ now }}</p>
        <p>屏幕分辨率：{{ screenWidth }} × {{ screenHeight }}</p>
        <p>设备 UA：<span class="pc-ua">{{ ua }}</span></p>
      </div>
      <button class="pc-btn" @click="refresh">刷新信息</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const now = ref('');
const screenWidth = ref(window.innerWidth);
const screenHeight = ref(window.innerHeight);
const ua = ref(navigator.userAgent);

function update() {
  now.value = new Date().toLocaleString();
  screenWidth.value = window.innerWidth;
  screenHeight.value = window.innerHeight;
}

function onResize() {
  screenWidth.value = window.innerWidth;
  screenHeight.value = window.innerHeight;
}

onMounted(() => {
  update();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.pc-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  padding: 24px;
}

.pc-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 56px;
  max-width: 640px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.pc-icon {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 16px;
}

.pc-title {
  font-size: 32px;
  color: #303133;
  margin: 0 0 12px;
}

.pc-desc {
  font-size: 18px;
  color: #606266;
  margin: 0 0 8px;
}

.pc-tip {
  font-size: 14px;
  color: #909399;
  margin: 0 0 28px;
}

.pc-meta {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  color: #606266;
  margin-bottom: 28px;
}

.pc-meta p {
  margin: 6px 0;
  word-break: break-all;
}

.pc-ua {
  color: #6b7280;
  font-size: 12px;
}

.pc-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 40px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pc-btn:hover {
  opacity: 0.9;
}
</style>
