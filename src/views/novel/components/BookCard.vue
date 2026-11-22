<template>
  <div 
    class="book-card" 
    :class="viewMode"
    @click="$emit('click')"
  >
    <!-- 图片区域 -->
    <div class="book-cover">
      <img :src="getAssetUrl(novel.cover)" :alt="novel.title" @error="handleImageError" />
      
      <!-- 角标 -->
      <div v-if="novel.isHot" class="badge hot">🔥 热门</div>
      <div v-if="novel.isRecommend" class="badge recommend">⭐ 推荐</div>
      <div v-if="novel.status === '连载中'" class="badge serializing">📝 连载</div>
      
      <!-- 评分 -->
      <div class="rating">
        <span class="rating-text">{{ novel.rating }}分</span>
      </div>
    </div>
    
    <!-- 信息区域 -->
    <div class="book-info">
      <div class="info-header">
        <h3 class="book-title" :title="novel.title">{{ novel.title }}</h3>
      </div>
      
      <p class="book-desc" v-if="viewMode === 'grid'">
        {{ truncateDescription(novel.description) }}
      </p>

      <div v-if="readProgress > 0 && novel.novelType === short" class="read-progress">
        阅读 {{ readProgress }} 章 / 共 {{ novel.chapters }} 章
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
import { defineProps, computed } from 'vue'
import Cookies from 'js-cookie'
import { getAssetUrl } from '../../../utils/asset'

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

defineEmits(['click'])

// 阅读进度（从 cookie 读取上次阅读到的章节）
const readProgress = computed(() => {
  const readerProgress = JSON.parse(Cookies.get('readerProgress') || '{}')
  return readerProgress[props.novel.id] || 0
})

// 方法
const truncateDescription = (text) => {
  // 这里处理描述
  return text
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 图片加载失败时显示默认图片
const handleImageError = (e) => {
    e.target.src = getAssetUrl('images/novel/novel002.png')
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
  height: 360lpx;
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
  top: 18lpx;
  padding: 8lpx 12lpx;
  border-radius: 4lpx;
  font-size: 18lpx;
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
  bottom: 10lpx;
  left: 10lpx;
  padding: 4lpx 8lpx;
}

.rating-text {
  color: white;
  font-size: 27lpx;
  font-weight: bold;
}

/* 信息区域 */
.book-info {
  padding: 18lpx;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-header {
  /* margin-bottom: 10px; */
}

.read-progress {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  text-align: left;
}

.book-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
}

/* 描述 */
.book-desc {
  font-size: 20lpx;
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
}
</style>