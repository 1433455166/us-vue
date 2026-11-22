<template>
  <div class="reader-controls">
    <div class="controls-main">
      <button 
        class="control-btn" 
        :class="{ disabled: currentChapter?.id <= 1 }"
        @click="handlePrev"
      >
        <SvgChevron direction="left" :size="18" />
        上一章
      </button>
      
      <div class="control-center">
        <button class="control-btn icon-only" @click="$emit('toggle-night-mode')">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn icon-only" @click="$emit('toggle-settings')">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <button 
        class="control-btn" 
        :class="{ disabled: currentChapter?.id >= totalChapters }"
        @click="handleNext"
      >
        下一章
        <SvgChevron direction="right" :size="18" />
      </button>
    </div>
    
    <div v-if="!isShortNovel" class="chapter-progress">
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
import SvgChevron from '../../../components/svgIcon/SvgChevron.vue';

const props = defineProps({
  currentChapter: Object,
  totalChapters: Number,
  isShortNovel: Boolean
})

const emit = defineEmits(['prev-chapter', 'next-chapter', 'toggle-night-mode', 'toggle-settings', 'go-to-chapter']);

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
  padding: 10px 18lpx;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.controls-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15lpx;
}

.control-btn {
  display: flex;
  align-items: center;
  padding: 6lpx 10lpx;
  background: white;
  border: 2lpx solid #e0e0e0;
  border-radius: 25lpx;
  cursor: pointer;
  font-size: 18lpx;
  color: #333;
  transition: all 0.2s;
}

.control-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.icon-only {
  padding: 6lpx;
}

.control-center {
  display: flex;
  gap: 10px;
}

.chapter-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18lpx;
  color: #666;
}

.progress-dots {
  display: flex;
  justify-content: space-between;
  /* gap: 4lpx; */
  width: 588lpx;
  margin-left: 8lpx;
}

.dot {
  width: 6lpx;
  height: 6lpx;
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
</style>