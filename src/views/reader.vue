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
      <Loading containerClass="reader-loading" v-if="loading"/>
      <div class="reader-content" ref="contentRef" v-else>
        <h2 class="chapter-title">{{ currentChapter?.title }}</h2>
        <div
          class="chapter-content"
          v-html="formattedContent"
          :style="contentStyle"
        />
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
            :totalChapters="chapterData.length"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ReaderHeader from '../components/reader/ReaderHeader.vue'
import ReaderControls from '../components/reader/ReaderControls.vue'
import ChapterList from '../components/reader/ChapterList.vue'
import ReaderSettings from '../components/reader/ReaderSettings.vue'
import Loading from '../components/Loading/default.vue';
import Cookies from 'js-cookie';
import { useRoute } from 'vue-router'
import { novels } from '../data/novels.js'
import threeBoby1 from '../data/threeBody/threeBoby1.json'
import { getNovelData, getNovelList, getNovelChapterContent, getNovelVolume } from "../utils/api";

// 响应式数据
const loading = ref(true)
const error = ref(false)
const novelInfo = ref({})
const chapters = ref([])
const currentChapter = ref(null)

const route = useRoute()

// 根据路由参数获取小说ID
const novelId = route.params.id

// 加载剑来小说数据（使用新的接口）
const loadUnsheathedNovelData = async () => {
  loading.value = true
  error.value = false
  
  try {
    // 1. 获取小说信息
    novelInfo.value = novels.find(n => n.id === novelId) || novels[0]

    // 2. 获取章节列表
    const listRes = await getNovelList({ novelName: novelId, folderName: novelInfo.value.folderName });
    
    const data = listRes?.data || {};
    
    // 处理数据结构，与普通小说保持一致
    if (listRes?.success && data?.chapters?.length > 0) {
      // 平铺章节数据
      chapters.value = data.chapters;
    } else if (listRes?.success && data?.volume?.length > 0) {
      // 分卷数据
      chapters.value = data.volume;
    } else if (listRes?.success && data?.volumes?.length > 0) {
      // 分卷数据
      chapters.value = data.volumes;
    } else {
      // 回退到本地JSON数据
      console.warn('API返回章节列表异常，使用本地数据')
      chapters.value = threeBoby1.chapters || []
    }
    
    // 3. 设置当前章节并加载内容
    if (chapters.value.length > 0) {
      const readerProgress = JSON.parse(Cookies.get('readerProgress') || '{}');
      const progress = readerProgress[novelId] - 1 || 0;
      
      // 使用 chapterData 计算属性来获取平铺的章节数据
      const flatChapters = chapterData.value;
      const chapterIndex = Math.max(0, Math.min(progress, flatChapters.length - 1));
      const targetChapterId = flatChapters[chapterIndex]?.id || 1;
      
      // 加载当前章节内容
      await loadChapterContent(targetChapterId);
    } else {
      // 如果没有章节数据，创建空章节
      currentChapter.value = {
        id: 1,
        title: '暂无内容',
        content: ['本章节内容正在准备中...']
      }
    }
    
  } catch (err) {
    console.error('加载剑来小说数据失败:', err)
    error.value = true
    
    // 出错时使用本地数据
    novelInfo.value = novels.find(n => n.id === 'unsheathed') || novels[0]
    chapters.value = threeBoby1.chapters || []
    if (chapters.value.length > 0) {
      currentChapter.value = chapters.value[0]
    }
  } finally {
    loading.value = false
  }
}

// 加载普通小说数据（使用原有接口）
const loadNormalNovelData = async () => {
  loading.value = true
  error.value = false
  
  try {
    // 1. 获取小说信息
    novelInfo.value = novels.find(n => n.id === novelId) || novels[0]

    // 2. 尝试从API获取章节数据
    const res = await getNovelData({ novelName: novelId, folderName: novelInfo.value.folderName });
    
    const data = res?.data || {};
    
    // 没有卷的数据类型
    if (res?.success && data?.chapters?.length > 0) {
      // 使用API返回的数据
      chapters.value = data.chapters
    } else if (res?.success && data?.volume?.length > 0) {
      // 分卷的数据类型
      const list = [];
      data.volume?.forEach((volume) => { list.push(...volume?.chapters) });
      chapters.value = data.volume;
    } else {
      // 回退到本地JSON数据
      console.warn('API返回数据异常，使用本地数据')
      chapters.value = threeBoby1.chapters || []
    }
    
    // 3. 设置当前章节
    if (chapters.value.length > 0) {
        const readerProgress = JSON.parse(Cookies.get('readerProgress') || '{}');
        const progress = readerProgress[novelId] - 1 || 0;
        currentChapter.value = chapterData.value[progress]
    } else {
      // 如果没有章节数据，创建空章节
      currentChapter.value = {
        id: 1,
        title: '暂无内容',
        content: ['本章节内容正在准备中...']
      }
    }
    
  } catch (err) {
    console.error('加载小说数据失败:', err)
    error.value = true
    
    // 出错时使用本地数据
    novelInfo.value = novels[0] || {}
    chapters.value = threeBoby1.chapters || []
    if (chapters.value.length > 0) {
      currentChapter.value = chapters.value[0]
    }
  } finally {
    loading.value = false
  }
}

// 加载指定章节的内容
const loadChapterContent = async (chapterId) => {
  try {
    const chapterRes = await getNovelChapterContent({ 
      novelName: novelId, 
      folderName: novelInfo.value.folderName, 
      chapterId: chapterId 
    });
    
    if (chapterRes?.success && chapterRes.data) {
      // 使用平铺的章节数据来查找章节信息
      const flatChapters = chapterData.value;
      const chapterInfo = flatChapters.find(c => c.id === chapterId);
      
      if (chapterInfo) {
        currentChapter.value = {
          ...chapterInfo,
          content: Array.isArray(chapterRes.data.content) ? chapterRes.data.content : [chapterRes.data.content]
        };
      } else {
        // 如果章节不在列表中，创建新章节对象
        currentChapter.value = {
          id: chapterId,
          title: chapterRes.data.title || `第${chapterId}章`,
          content: Array.isArray(chapterRes.data.content) ? chapterRes.data.content : [chapterRes.data.content]
        };
      }
    } else {
      // API返回异常，使用平铺章节数据中的基本信息
      const flatChapters = chapterData.value;
      const chapterInfo = flatChapters.find(c => c.id === chapterId);
      currentChapter.value = chapterInfo || {
        id: chapterId,
        title: `第${chapterId}章`,
        content: ['本章节内容正在加载中...']
      };
    }
  } catch (err) {
    console.error('加载章节内容失败:', err);
    // 使用平铺章节数据中的基本信息
    const flatChapters = chapterData.value;
    const chapterInfo = flatChapters.find(c => c.id === chapterId);
    currentChapter.value = chapterInfo || {
      id: chapterId,
      title: `第${chapterId}章`,
      content: ['加载章节内容失败，请稍后重试...']
    };
  }
}

// 加载数据
const loadNovelData = async () => {
  // 针对剑来小说使用新的接口方式
  if (novelId === 'unsheathed') {
    await loadUnsheathedNovelData();
  } else {
    await loadNormalNovelData();
  }
}

// 状态控制
const showChapterList = ref(false)
const showSettings = ref(false)
const showControls = ref(true)
const showTapHint = ref(true)
const isNightMode = ref(false)

// 从cookie中读取阅读设置或使用默认值
const getInitialReaderSettings = () => {
  const savedSettings = Cookies.get('readerSettings')
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings)
    } catch (e) {
      console.warn('Failed to parse reader settings from cookie, using defaults')
    }
  }
  // 默认设置
  return {
    fontSize: 16,
    lineHeight: 1.8,
    fontFamily: 'system-ui',
    theme: 'light',
    brightness: 100
  }
}

// 阅读设置
const readerSettings = ref(getInitialReaderSettings())

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
    .replace(/,/g, '<br><br>')
    .replace(/\s{4,}/g, '　　')
});

const chapterData = computed(() => {
    // 卷的情况
    const isVolumeId = !!chapters.value?.find(c => c.volumeId);
    const data = isVolumeId ? chapters.value.reduce((acc, cur) => {
        acc.push(...cur.chapters);
        return acc;
    }, []) : chapters.value;
    return data
});

// 上一章下一章 - 注意要使用 .value
const goToChapter = async (chapterId) => {
    const data = chapterData.value;
    
    if (!data || data.length === 0) return;

    // 找到目标章节在平铺数据中的位置
    const targetChapter = data.find(c => c.id === chapterId);
    if (!targetChapter) {
        // 如果找不到指定章节，尝试找最接近的章节
        const validIds = data.map(c => c.id).sort((a, b) => a - b);
        let closestId = chapterId;
        if (chapterId < validIds[0]) {
            closestId = validIds[0];
        } else if (chapterId > validIds[validIds.length - 1]) {
            closestId = validIds[validIds.length - 1];
        } else {
            // 找到最接近的章节ID
            closestId = validIds.reduce((prev, curr) => 
                Math.abs(curr - chapterId) < Math.abs(prev - chapterId) ? curr : prev
            );
        }
        await loadChapterContent(closestId);
    } else {
        // 加载新章节内容
        await loadChapterContent(chapterId);
    }
    
    showChapterList.value = false
    readingProgress.value = 0
    setTimeout(() => {
        if (contentRef.value) {
            contentRef.value.scrollTop = 0
        }
    }, 100)
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

let scrollHandler = null

// 监听 contentRef 的变化
watch(contentRef, (newEl, oldEl) => {
  // 移除旧元素的事件监听
  if (oldEl && scrollHandler) {
    oldEl.removeEventListener('scroll', scrollHandler)
  }
  
  // 为新元素添加事件监听
  if (newEl) {
    scrollHandler = handleScroll
    newEl.addEventListener('scroll', scrollHandler)
    
    // 初始滚动位置
    newEl.scrollTop = 0
  }
}, { flush: 'post' }) // 'post' 确保DOM已更新

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
    loadNovelData() // 页面加载时获取数据

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
  if (contentRef.value && scrollHandler) {
    contentRef.value.removeEventListener('scroll', scrollHandler)
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

.reader-loading {
    height: 100vh;
    justify-content: center !important;
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
