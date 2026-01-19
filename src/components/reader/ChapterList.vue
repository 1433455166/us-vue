<template>
  <div class="chapter-list-overlay" @click="$emit('close')">
    <div class="chapter-list" @click.stop>
      <div class="list-header">
        <h3>章节列表</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="list-content">
        <div 
          v-for="chapter in chapters" 
          :key="chapter.id"
          class="chapter-item"
          :class="{ active: chapter.id === currentId }"
          @click="selectChapter(chapter.id)"
        >
          <div class="item-main">
            <span class="chapter-number">第{{ chapter.id }}章</span>
            <span class="word-count">{{ chapter.wordCount }}字</span>
          </div>
          <div>
            <span class="chapter-title">{{ chapter.title }}</span>
          </div>
          <div class="item-meta">
            <span class="read-time">{{ chapter.readTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  chapters: Array,
  currentId: Number
});

const emit = defineEmits(['select-chapter', 'close'])

const selectChapter = (chapterId) => {
  emit('select-chapter', chapterId)
  emit('close')
}
</script>
<style scoped>
.chapter-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.chapter-list {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.list-content {
  height: calc(100% - 70px);
  overflow-y: auto;
  padding: 10px 0;
}

.chapter-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20lpx 30lpx;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;
}

.chapter-item:hover {
  background: #f9f9f9;
}

.chapter-item.active {
  background: #e8f4ff;
  border-left: 3px solid #4a90e2;
}

.item-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.word-count {
  font-size: 24lpx;
  color: #999;
}

.chapter-number {
  font-size: 14px;
  color: #666;
  min-width: 50px;
}

.chapter-title {
    display: inline-block;
    font-size: 30lpx;
    color: #333;
    font-weight: 500;
    width: 308lpx;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@media (max-width: 480px) {
  .chapter-list {
    width: 280px;
  }
  
  .list-header {
    padding: 15px;
  }
}
</style>
