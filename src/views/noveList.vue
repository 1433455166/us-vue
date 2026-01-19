<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <header class="home-header">
        <p>小说列表</p>
    </header>
    
    <!-- 主内容 -->
    <main class="home-main" ref="contentRef">
      <!-- 推荐区域 -->
      <section v-if="activeCategory === 'all'" class="recommend-section">
        <div class="recommend-list">
          <BookCard 
            v-for="novel in hotNovels"
            :key="novel.id"
            :novel="novel"
            :view-mode="viewMode"
            @click="goToReader(novel.id)"
          />
        </div>
      </section>
      
      <!-- 小说列表 -->
      <section class="novel-list-section">
        <!-- 空状态 -->
        <div v-if="filteredNovels.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8h-8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z" fill="currentColor"/>
          </svg>
          <p>暂无相关小说</p>
          <button class="btn-primary" @click="resetFilters">重置筛选</button>
        </div>
      </section>
    </main>
    
    <!-- 回到顶部 -->
    <button 
      v-show="showBackToTop"
      class="back-to-top"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from '../components/novel/BookCard.vue'
import { novels } from '../data/novels.js'

const router = useRouter()

// 状态管理
const contentRef = ref(null)
const searchQuery = ref('')
const activeCategory = ref('all')
const sortBy = ref('update')
const viewMode = ref('grid')
const currentPage = ref(1)
const showBackToTop = ref(false)

// 计算属性
const hotNovels = computed(() => {
  return novels.filter(novel => novel.isHot).slice(0, 4)
})

const filteredNovels = computed(() => {
  let result = [...novels]
  
  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(novel => 
      novel.title.toLowerCase().includes(query) ||
      novel.author.toLowerCase().includes(query) ||
      novel.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // 分类筛选
  if (activeCategory.value !== 'all') {
    // 这里简化处理，实际应该根据分类ID筛选
    result = result.filter(novel => {
      if (activeCategory.value === 'xuanhuan') return novel.category.includes('玄幻')
      if (activeCategory.value === 'kehuan') return novel.category.includes('科幻')
      if (activeCategory.value === 'xuanyi') return novel.category.includes('悬疑')
      if (activeCategory.value === 'lishi') return novel.category.includes('历史')
      return true
    })
  }
  
  // 排序
  switch(sortBy.value) {
    case 'update':
      result.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate))
      break
    case 'hot':
      result.sort((a, b) => b.views - a.views)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'views':
      result.sort((a, b) => b.views - a.views)
      break
    case 'words':
      result.sort((a, b) => parseFloat(b.wordCount) - parseFloat(a.wordCount))
      break
  }
  
  return result;
})

const goToReader = (novelId) => {
    // 目前只限制 三体 可以点进去
    if (novelId !== 'sati') return;
    router.push(`/reader/${novelId}`);
}

const resetFilters = () => {
  searchQuery.value = ''
  activeCategory.value = 'all'
  sortBy.value = 'update'
  currentPage.value = 1
}

const scrollToTop = () => {
  contentRef.value.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听滚动
const handleScroll = () => {
    showBackToTop.value = contentRef.value?.scrollTop > 100
}

// 生命周期
onMounted(() => {
    if (contentRef.value) {
        contentRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
})

onUnmounted(() => {
    // 方式2：监听特定元素（如果元素可滚动）
    if (contentRef.value && contentRef.value.scrollHeight > contentRef.value.clientHeight) {
        contentRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
})
</script>
<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  position: relative;
  overflow: hidden; /* 隐藏滚动条 */
}

/* 顶部导航 */
.home-header {
  padding: 12lpx 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 20px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.logo p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.user-actions {
  display: flex;
  gap: 15px;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 主内容 */
.home-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 27lpx;
  padding-bottom: 80px; /* 为底部导航留空间 */
  height: 100vh;
  overflow-y: auto; /* 内部可滚动 */

  /* 隐藏所有浏览器的滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* Chrome, Safari, Edge */
.home-main::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.sort-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sort-btn {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.sort-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.sort-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.view-toggle {
  display: flex;
  gap: 10px;
}

.view-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.view-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.view-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* 推荐区域 */
.recommend-section {
  margin: 0 0 30px;
}

.recommend-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 27lpx;
}

/* 小说列表区域 */
.novel-list-section {
  margin-top: 40px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.section-title span:first-child {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.see-more {
  font-size: 14px;
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s;
}

.see-more:hover {
  color: #764ba2;
}

.novel-count {
  font-size: 14px;
  color: #666;
}

/* 小说列表布局 */
.novel-list {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

.novel-list.grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.novel-list.list {
  grid-template-columns: 1fr;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.empty-state svg {
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

/* 底部导航 */
.home-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.footer-nav {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  max-width: 500px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  transition: all 0.3s;
  border-radius: 12px;
}

.nav-item.active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.nav-item span {
  font-size: 12px;
  margin-top: 4px;
}

.nav-item:hover:not(.active) {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
}

/* 回到顶部 */
.back-to-top {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  z-index: 99;
}

.back-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logo h1 {
    font-size: 20px;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .sort-options {
    justify-content: center;
  }
  
  .view-toggle {
    align-self: flex-end;
  }
  
  .novel-list.grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  
  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .back-to-top {
    bottom: 70px;
    right: 10px;
    width: 45px;
    height: 45px;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .novel-list.grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .recommend-list {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-content {
    padding: 0 15px;
  }
}
</style>
