<template>
  <div class="reader-controls">
    <div class="controls-main">
      <button 
        class="control-btn" 
        :class="{ disabled: currentChapter?.id <= 1 }"
        @click="handlePrev"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
        </svg>
        上一章
      </button>
      
      <div class="control-center">
        <button class="control-btn icon-only" @click="$emit('toggle-night-mode')">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <button 
        class="control-btn" 
        :class="{ disabled: currentChapter?.id >= totalChapters }"
        @click="handleNext"
      >
        下一章
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
        </svg>
      </button>
    </div>
    
    <div class="chapter-progress">
      <span>第{{ currentChapter?.id }}/{{ totalChapters }}章</span>
      <div class="progress-dots">
        <span 
          v-for="n in totalChapters" 
          :key="n"
          class="dot"
          :class="{ active: n === currentChapter?.id }"
          @click="$emit('go-to-chapter', n)"
        ></span>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  currentChapter: Object,
  totalChapters: Number
})

const emit = defineEmits(['prev-chapter', 'next-chapter', 'toggle-night-mode', 'go-to-chapter']);

const handlePrev = () => {
  if (props.currentChapter.id > 1) {
    emit('prev-chapter')
  }
}

const handleNext = () => {
  if (props.currentChapter.id < props.totalChapters) {
    emit('next-chapter')
  }
}
</script>
<style scoped>
.reader-controls {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.controls-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8lpx;
  padding: 10lpx 20lpx;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 25lpx;
  cursor: pointer;
  font-size: 14lpx;
  color: #333;
  transition: all 0.2s;
}

.control-btn:hover:not(.disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.icon-only {
  padding: 10px;
}

.control-center {
  display: flex;
  gap: 10px;
}

.chapter-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24lpx;
  color: #666;
}

.progress-dots {
  display: flex;
  gap: 6lpx;
}

.dot {
  width: 10lpx;
  height: 10lpx;
  border-radius: 50%;
  background: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  background: #4a90e2;
  transform: scale(1.2);
}

.dot:hover {
  background: #ccc;
}

@media (max-width: 768px) {
  .reader-controls {
    padding: 10px 15px;
  }
  
  .control-btn {
    padding: 8px 15px;
    font-size: 13px;
  }
  
  .control-btn.icon-only {
    padding: 8px;
  }
}
</style>
