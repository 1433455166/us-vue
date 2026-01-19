<template>
  <div 
    class="book-card" 
    :class="viewMode"
    @click="$emit('click')"
  >
    <!-- 图片区域 -->
    <div class="book-cover">
      <img :src="novel.cover" :alt="novel.title" @error="handleImageError" />
      
      <!-- 角标 -->
      <div v-if="novel.isHot" class="badge hot">🔥 热门</div>
      <div v-if="novel.isRecommend" class="badge recommend">⭐ 推荐</div>
      <div v-if="novel.status === '连载中'" class="badge serializing">📝 连载</div>
      
      <!-- 评分 -->
      <div class="rating">
        <span class="rating-stars">★★★★★</span>
        <span class="rating-text">{{ novel.rating }}</span>
      </div>
    </div>
    
    <!-- 信息区域 -->
    <div class="book-info">
      <div class="info-header">
        <h3 class="book-title" :title="novel.title">{{ novel.title }}</h3>
        <div class="book-meta">
          <span class="author">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
            {{ novel.author }}
          </span>
          <span class="category">{{ novel.category }}</span>
        </div>
      </div>
      
      <p class="book-desc" v-if="viewMode === 'grid'">
        {{ truncateDescription(novel.description) }}
      </p>
      
      <!-- 标签 -->
      <div class="book-tags">
        <span 
          v-for="(tag, index) in novel.tags.slice(0, viewMode === 'grid' ? 2 : 4)"
          :key="index"
          class="tag"
        >
          {{ tag }}
        </span>
        <span v-if="novel.tags.length > 2 && viewMode === 'grid'" class="tag-more">
          +{{ novel.tags.length - 2 }}
        </span>
      </div>
      
      <!-- 底部信息 -->
      <div class="book-footer">
        <div class="footer-left">
          <span class="word-count">
            <svg viewBox="0 0 24 24" :width="SVG_SIZE" :height="SVG_SIZE">
              <path d="M13.5 6H10V4h3.5c.82 0 1.5.68 1.5 1.5S14.32 7 13.5 7zM13 22H3c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8v7c0 .55.45 1 1 1h7v10c0 1.1-.9 2-2 2zm6-11l-6-6v5h5v1z" fill="currentColor"/>
            </svg>
            {{ novel.wordCount }}
          </span>
          <span class="chapters">
            <svg viewBox="0 0 24 24" :width="SVG_SIZE" :height="SVG_SIZE">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z" fill="currentColor"/>
            </svg>
            {{ novel.chapters }}章
          </span>
        </div>
        
        <div class="footer-right">
          <span class="views">
            <svg viewBox="0 0 24 24" :width="SVG_SIZE" :height="SVG_SIZE">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
            </svg>
            {{ formatViews(novel.views) }}
          </span>
        </div>
      </div>
      
      <!-- 列表模式额外信息 -->
      <div v-if="viewMode === 'list'" class="list-extra">
        <p class="full-desc">{{ novel.description }}</p>
        <div class="extra-meta">
          <span>最后更新: {{ formatDate(novel.lastUpdate) }}</span>
          <span>状态: {{ novel.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { defineProps } from 'vue'
import { lpxToVw } from '../../utils/lpx'

const props = defineProps({
  novel: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid' // grid | list
  }
})

// svg 大小
const SVG_SIZE = lpxToVw(13);

defineEmits(['click'])

// 方法
const truncateDescription = (text) => {
  // 这里处理描述
  return text
}

const formatViews = (views) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views.toString()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 图片加载失败时显示默认图片
const handleImageError = (e) => {
    e.target.src = '../../../public/images/novel/novel002.png'
}
</script>
<style scoped>
.book-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card.grid {
  flex-direction: column;
}

.book-card.list {
  flex-direction: row;
  gap: 20px;
  padding: 20px;
}

/* 封面 */
.book-cover {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.book-card.grid .book-cover {
  height: 200px;
}

.book-card.list .book-cover {
  width: 120px;
  height: 160px;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.book-card:hover .book-cover img {
  transform: scale(1.05);
}

/* 角标 */
.badge {
  position: absolute;
  top: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 1;
}

.badge.hot {
  left: 10px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
}

.badge.recommend {
  right: 10px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.badge.serializing {
  left: 10px;
  background: linear-gradient(135deg, #42e695, #3bb2b8);
}

/* 评分 */
.rating {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-stars {
  color: #ffc107;
  font-size: 12px;
  letter-spacing: -1px;
}

.rating-text {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* 信息区域 */
.book-info {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-header {
  margin-bottom: 10px;
}

.book-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22lpx;
  color: #666;
}

.author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18lpx;
}

.category {
  background: #f0f0f0;
  padding: 4lpx 14lpx;
  border-radius: 4px;
  font-size: 16lpx;
}

/* 描述 */
.book-desc {
  font-size: 14px;
  color: #666;
  margin: 12lpx 0;
  flex: 1;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 5; /* 显示的行数 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

/* 标签 */
.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}

.tag {
  font-size: 22lpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
}

.tag-more {
  font-size: 19lpx;
  display: flex;
  align-items: center;
  color: #999;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 12px;
}

/* 底部 */
.book-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12lpx;
  color: #999;
  margin-top: auto;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-left span, .footer-right span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 列表模式额外信息 */
.list-extra {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.full-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 10px;
}

.extra-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .book-card.list {
    flex-direction: column;
    padding: 15px;
  }
  
  .book-card.list .book-cover {
    width: 100%;
    height: 180px;
  }
  
  .book-title {
    font-size: 15px;
  }
  
  .book-desc {
    font-size: 13px;
  }
}
</style>
