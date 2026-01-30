<template>
  <header class="reader-header">
    <div class="header-left">
      <button class="icon-btn" @click="$emit('toggle-chapter-list')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
        </svg>
      </button>
      <div class="header-info" @click="goBack">
        <h1 class="novel-title">{{ title }}</h1>
        <p class="novel-author">{{ author }}</p>
      </div>
    </div>
    
    <div class="header-right">
      <button class="icon-btn" @click="$emit('toggle-settings')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
        </svg>
      </button>
      
      <div class="chapter-info">
        <span class="current-chapter">第{{ currentChapter?.id }}章</span>
        <span class="chapter-title">{{ currentChapter?.title }}</span>
      </div>
    </div>
  </header>
</template>
<script setup>
import Cookies from 'js-cookie';
import { useRoute } from 'vue-router'

const route = useRoute();

const props = defineProps({
  title: String,
  author: String,
  currentChapter: Object
})

defineEmits(['toggle-chapter-list', 'toggle-settings']);

function goBack() {
    const novelId = route.params?.id
    const readerProgress = JSON.parse(Cookies.get('readerProgress') || '{}');
    const readerProgressCookie = { ...readerProgress, [novelId]: props?.currentChapter?.id }
    // 设置 cookie
    Cookies.set('readerProgress', JSON.stringify(readerProgressCookie), { expires: 7 }); // 有效期为7天
    window.history.back();
}
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

.header-info {
  display: flex;
  flex-direction: column;
}

.novel-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.novel-author {
  font-size: 14px;
  margin: 0;
  color: #666;
}

.icon-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.current-chapter {
  font-size: 12px;
  color: #999;
}

.chapter-title {
  font-size: 14px;
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
  
  .novel-title {
    font-size: 16px;
  }
  
  .novel-author {
    font-size: 12px;
  }
  
  .chapter-title {
    max-width: 100px;
  }
}
</style>
