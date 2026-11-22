<template>
  <header class="reader-header">
    <div class="header-left">
      <button class="icon-btn back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
        </svg>
      </button>
      <div v-if="!isShortNovel" class="chapter-info">
        <span class="current-chapter">第{{ currentChapter?.id }}章</span>
        <span class="chapter-title">{{ currentChapter?.title }}</span>
      </div>
    </div>
    
    <div class="header-right">
      <button class="icon-btn" @click="$emit('toggle-chapter-list')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </header>
</template>
<script setup>
import Cookies from 'js-cookie';
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

const route = useRoute();

const props = defineProps({
  currentChapter: Object,
  isShortNovel: Boolean
})

defineEmits(['toggle-chapter-list']);

function recordProgress() {
    const chapterId = props?.currentChapter?.id
    if (!chapterId) return

    const novelId = route.params?.id
    const readerProgress = JSON.parse(Cookies.get('readerProgress') || '{}');
    const readerProgressCookie = { ...readerProgress, [novelId]: chapterId }
    // 设置 cookie
    Cookies.set('readerProgress', JSON.stringify(readerProgressCookie), { expires: 7 }); // 有效期为7天
}

function goBack() {
    recordProgress()
    window.history.back();
}

// 手势返回（浏览器前进/后退、边缘滑动）时也记录进度
function handlePopState() {
    recordProgress()
}

onMounted(() => {
    window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState)
})
</script>
<style scoped>
.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.chapter-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.current-chapter {
  font-size: 27lpx;
  color: #333;
}

.chapter-title {
  font-size: 27lpx;
  font-weight: 500;
  color: #333;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .reader-header {
    padding: 10px 15px;
  }
  
  .chapter-title {
    max-width: 100px;
  }
}
</style>