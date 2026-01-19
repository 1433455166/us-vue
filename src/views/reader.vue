<template>
  <div class="reader-container" :class="readerTheme">
    <!-- 头部 - 滑动淡入淡出 -->
    <transition name="header-slide">
      <ReaderHeader 
        v-show="showControls"
        :title="novelInfo.title" 
        :author="novelInfo.author"
        :currentChapter="currentChapter"
        @toggle-chapter-list="showChapterList = !showChapterList"
        @toggle-settings="showSettings = !showSettings"
      />
    </transition>
    
    <!-- 阅读区域 -->
    <main class="reader-main" @click="handleTap">
      <div class="reader-content" ref="contentRef">
        <h2 class="chapter-title">{{ currentChapter?.title }}</h2>
        <div 
          class="chapter-content" 
          v-html="formattedContent"
          :style="contentStyle"
        ></div>
      </div>
      
      <!-- 阅读进度 -->
      <div class="reader-progress">
        <div class="progress-bar" :style="{ width: `${readingProgress}%` }"></div>
        <span class="progress-text">
          第{{ currentChapter?.id }}章 · {{ readingProgress.toFixed(1) }}%
        </span>
      </div>
    </main>
    
    <!-- 底部 - 上滑淡入淡出 -->
    <transition name="footer-slide">
        <ReaderControls 
            v-show="showControls"
            :currentChapter="currentChapter"
            :totalChapters="chapters.length"
            @prev-chapter="goToChapter(currentChapter.id - 1)"
            @next-chapter="goToChapter(currentChapter.id + 1)"
            @toggle-night-mode="toggleNightMode"
        />
    </transition>
    
    <!-- 章节列表 -->
    <transition name="slide-left">
      <ChapterList 
        v-if="showChapterList"
        :chapters="chapters"
        :currentId="currentChapter.id"
        @select-chapter="goToChapter"
        @close="showChapterList = false"
      />
    </transition>
    
    <!-- 阅读设置 -->
    <transition name="slide-up">
      <ReaderSettings 
        v-if="showSettings"
        :settings="readerSettings"
        @update-settings="updateSettings"
        @close="showSettings = false"
      />
    </transition>
    
    <!-- 快捷操作提示 -->
    <div v-if="showTapHint" class="tap-hint">
      <span>点击屏幕显示/隐藏控制面板</span>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ReaderHeader from '../components/reader/ReaderHeader.vue'
import ReaderControls from '../components/reader/ReaderControls.vue'
import ChapterList from '../components/reader/ChapterList.vue'
import ReaderSettings from '../components/reader/ReaderSettings.vue'

import { useRoute } from 'vue-router'
import { novels } from '../data/novels.js'
import threeBoby1 from '../data/threeBody/threeBoby1.json'

const route = useRoute()

const novelText = threeBoby1.chapters;
console.log('novelText', novelText);

// 根据路由参数获取小说ID
const novelId = route.params.id

// 获取小说信息
const novelInfo = ref(novels.find(n => n.id === novelId) || novels[0])

// 这里可以根据 novelId 加载对应的小说章节数据
// 实际项目中应该从API获取数据
const chapters = novelText // 暂时先用三体数据

// 当前章节
const currentChapter = ref(chapters[0]);

// 状态控制
const showChapterList = ref(false)
const showSettings = ref(false)
const showControls = ref(true)
const showTapHint = ref(true)
const isNightMode = ref(false)

// 阅读设置
const readerSettings = ref({
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'system-ui',
  theme: 'light',
  brightness: 100
})

// 阅读进度
const readingProgress = ref(0)
const contentRef = ref(null)

// 计算属性
const readerTheme = computed(() => ({
  'night-mode': isNightMode.value,
  'theme-light': readerSettings.value.theme === 'light',
  'theme-dark': readerSettings.value.theme === 'dark',
  'theme-sepia': readerSettings.value.theme === 'sepia'
}))

const contentStyle = computed(() => ({
  fontSize: `${readerSettings.value.fontSize}px`,
  lineHeight: readerSettings.value.lineHeight,
  fontFamily: readerSettings.value.fontFamily,
}));

const formattedContent = computed(() => {
  return currentChapter.value?.content.join(',')
    // .replace(/\n/g, '<br>')
    .replace(/,/g, '<br><br>')
    .replace(/\s{4,}/g, '<p class="indent"></p>')
});

// 方法
const goToChapter = (chapterId) => {
  if (chapterId >= 1 && chapterId <= chapters.length) {
    currentChapter.value = chapters[chapterId - 1]
    showChapterList.value = false
    readingProgress.value = 0
    setTimeout(() => {
      if (contentRef.value) {
        contentRef.value.scrollTop = 0
      }
    }, 100)
  }
}

const handleTap = () => {
  showControls.value = !showControls.value
  if (showTapHint.value) {
    showTapHint.value = false
    setTimeout(() => {
      showTapHint.value = true
    }, 3000)
  }
}

const toggleNightMode = () => {
  isNightMode.value = !isNightMode.value
}

const updateSettings = (newSettings) => {
  readerSettings.value = { ...readerSettings.value, ...newSettings }
}

// 监听滚动进度
const handleScroll = () => {
  if (!contentRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = contentRef.value
  const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
  
  if (!isNaN(progress)) {
    readingProgress.value = Math.min(100, Math.max(0, progress))
  }
}

// 键盘快捷键
const handleKeyDown = (e) => {
  switch(e.key) {
    case 'ArrowLeft':
      goToChapter(currentChapter.value.id - 1)
      break
    case 'ArrowRight':
      goToChapter(currentChapter.value.id + 1)
      break
    case ' ':
    case 'Spacebar':
      handleTap()
      break
    case 'n':
    case 'N':
      toggleNightMode()
      break
  }
}

// 生命周期
onMounted(() => {
  if (contentRef.value) {
    contentRef.value.addEventListener('scroll', handleScroll)
  }
  window.addEventListener('keydown', handleKeyDown)
  
  // 3秒后隐藏提示
  setTimeout(() => {
    showTapHint.value = false
  }, 3000)
})

onUnmounted(() => {
  if (contentRef.value) {
    contentRef.value.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
<style scoped>
/* 头部动画 */
.header-slide-enter-active,
.header-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.header-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 底部动画 */
.footer-slide-enter-active,
.footer-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-slide-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.footer-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}


.reader-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 主题样式 */
.reader-container.theme-light {
  background-color: #f8f5f0;
  color: #333;
}

.reader-container.theme-dark {
  background-color: #1a1a1a;
  color: #ccc;
}

.reader-container.theme-sepia {
  background-color: #f4ecd8;
  color: #5c4b3a;
}

.reader-container.night-mode {
  background-color: #0a0a0a;
  color: #888;
  filter: invert(90%) hue-rotate(180deg);
}

/* 阅读主区域 */
.reader-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  position: relative;
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  scroll-behavior: smooth;

  /* 隐藏所有浏览器的滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* Chrome, Safari, Edge */
.reader-content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.chapter-title {
  font-size: 33lpx;
  font-weight: bold;
  margin-bottom: 30px;
  text-align: center;
  color: inherit;
  border-bottom: 2px solid currentColor;
  padding-bottom: 15px;
}

.chapter-content {
  text-align: justify;
  letter-spacing: 0.5px;
}

.chapter-content p {
  margin-bottom: 1.2em;
  text-indent: 2em;
}

.chapter-content .indent {
  margin-bottom: 1.5em;
}

/* 阅读进度 */
.reader-progress {
  height: 8lpx;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  margin-top: 36lpx;
  border-radius: 4lpx;
}

.progress-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-text {
  position: absolute;
  top: -36lpx;
  right: 0;
  font-size: 24lpx;
  color: #666;
}

/* 点击提示 */
.tap-hint {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  animation: fadeInOut 3s ease-in-out;
  z-index: 1000;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  20%, 80% { opacity: 1; }
}

/* 过渡动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-main {
    padding: 10px;
  }
  
  .reader-content {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .reader-content {
    padding: 10px;
  }
}
</style>
