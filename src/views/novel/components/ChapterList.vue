<template>
  <div class="chapter-list-overlay" @click="$emit('close')">
    <div class="chapter-list" @click.stop>
      <div class="drawer-handle"></div>

      <div class="list-header">
        <div class="header-left">
          <img v-if="novelInfo.cover" class="novel-cover" :src="getAssetUrl(novelInfo.cover)" alt="小说封面" />
          <div class="header-info">
            <h3 class="novel-title">
                {{ novelInfo.title }}
                <span v-if="novelInfo.category" class="detail-category">{{ novelInfo.category }}</span>
            </h3>
            <p class="novel-author">{{ novelInfo.author }}</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <SvgClose :size="24" />
        </button>
      </div>

      <div class="tab-bar">
        <button
          v-if="!isShortNovel"
          class="tab"
          :class="{ active: activeTab === 'catalog' }"
          @click="activeTab = 'catalog'"
        >目录</button>
        <button
          class="tab"
          :class="{ active: activeTab === 'detail' }"
          @click="activeTab = 'detail'"
        >详情</button>
      </div>

      <!-- 目录 -->
      <div v-show="activeTab === 'catalog'" class="list-content" ref="listRef">
        <ChapterItem
            v-for="volume in chapters"
            :key="volume.volumeId || volume.id"
            :chapter="volume"
            :currentId="currentId"
            :expandedMap="expandedMap"
            @select="selectChapter"
            :setItemRef="(el, id) => setItemRef(el, id)"
        />
      </div>

      <!-- 详情 -->
      <div v-show="activeTab === 'detail'" class="detail-content">
        <div class="detail-meta">
          <div class="detail-meta-top">
            <div class="detail-rating">
                <span class="detail-rating-text">{{ novelInfo.rating }}</span>
                <span class="detail-rating-stars">★★★★★</span>
            </div>

            <div class="detail-stats">
            <span class="detail-stat">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
              </svg>
              {{ formatViews(novelInfo.views) }}
            </span>
            <span class="detail-stat">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M13.5 6H10V4h3.5c.82 0 1.5.68 1.5 1.5S14.32 7 13.5 7zM13 22H3c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8v7c0 .55.45 1 1 1h7v10c0 1.1-.9 2-2 2zm6-11l-6-6v5h5v1z" fill="currentColor"/>
              </svg>
              {{ novelInfo.wordCount }}
            </span>
          </div>
          </div>
        </div>
        <p class="detail-text">{{ novelInfo.description }}</p>
        <div v-if="novelInfo.tags && novelInfo.tags.length" class="detail-tags">
            <span
              v-for="(tag, index) in novelInfo.tags"
              :key="index"
              class="detail-tag"
            >{{ tag }}</span>
        </div>
      </div>

      <!-- 定位器 -->
      <button
          v-show="showLocator && activeTab === 'catalog'"
          class="locator-btn"
          @click="scrollToCurrent"
      >
          📍
      </button>
    </div>
  </div>
</template>
<script setup>
import { onMounted, watch, nextTick, ref, reactive } from 'vue'
import ChapterItem from "./ChapterItem.vue"
import SvgClose from '../../../components/svgIcon/SvgClose.vue'
import { getAssetUrl } from '../../../utils/asset'

const props = defineProps({
  chapters: Array,
  currentId: Number,
  novelInfo: {
    type: Object,
    default: () => ({})
  },
  isShortNovel: Boolean
});

const expandedMap = reactive({})
const activeTab = ref(props.isShortNovel ? 'detail' : 'catalog')

watch(() => props.isShortNovel, (isShort) => {
  if (isShort) {
    activeTab.value = 'detail'
  }
})

const emit = defineEmits(['select-chapter', 'close'])

const formatViews = (views) => {
  if (!views) return '0'
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + '万'
  }
  return views.toString()
}

const selectChapter = (chapterId) => {
  emit('select-chapter', chapterId)
  emit('close')
}

// 定位器
const itemRefs = new Map()
const listRef = ref(null)
const showLocator = ref(false)

const setItemRef = (el, id) => {
  if (el) {
    itemRefs.set(id, el)
  }
}

const scrollToCurrent = async () => {
  await nextTick()

  const el = listRef.value?.querySelector(
    `[data-id="${props.currentId}"]`
  )

  if (!el) return

  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  })

    requestAnimationFrame(() => {
        checkCurrentVisible()
    })
}

const checkCurrentVisible = () => {
  const listEl = listRef.value
  if (!listEl) return

  const itemEl = listEl.querySelector(
    `[data-id="${props.currentId}"]`
  )

  if (!itemEl) {
    showLocator.value = false
    return
  }

  const listRect = listEl.getBoundingClientRect()
  const itemRect = itemEl.getBoundingClientRect()

  const visible =
    itemRect.top >= listRect.top &&
    itemRect.bottom <= listRect.bottom

  showLocator.value = !visible
}

/* =====================
   生命周期
===================== */
onMounted(async () => {
    expandParentVolume(props.currentId);
    await nextTick(scrollToCurrent);
    scrollToCurrent();
    listRef.value?.addEventListener('scroll', checkCurrentVisible);
})

const expandParentVolume = (chapterId) => {
  props.chapters.forEach(volume => {
    const found = volume.chapters?.some(
      c => c.id === chapterId
    )

    if (found) {
      expandedMap[volume.volumeId] = true
    }
  })
}

watch(() => props.currentId, async () => {
    expandParentVolume(props.currentId);
    await nextTick();
    scrollToCurrent();
})

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
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-height: 81vh;
  background: white;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  margin: 10px auto 0;
  flex-shrink: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.novel-cover {
  width: 48px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f0f0f0;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.novel-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.novel-author {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.tab-bar {
  display: flex;
}

.tab {
  flex: 1;
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  color: #4a90e2;
  font-weight: 600;
  position: relative;
}

.tab.active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;          /* 改成 left:50%; right:auto; transform:translateX(-50%); 可居中定宽 */
    bottom: 0;
    height: 3px;       /* 下划线粗细 */
    background: #4a90e2;
    border-radius: 2px; /* 可选圆角 */
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  text-indent: 2em;
  text-align: justify;
}

.detail-meta {
  margin-bottom: 16px;
}

.detail-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-rating-stars {
  color: #ffc107;
  font-size: 14px;
  letter-spacing: -1px;
}

.detail-rating-text {
  color: #ff9800;
  font-size: 14px;
  font-weight: bold;
}

.detail-category {
  display: inline-block;
  background: #f0f0f0;
  padding: 8lpx 14lpx;
  border-radius: 4lpx;
  font-size: 18lpx;
  color: #666;
  margin-left: 10lpx;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
}

.detail-tag {
  font-size: 13px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
}

.detail-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: #999;
}

.detail-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.locator-btn {
    position: absolute;
    right: 32lpx;
    bottom: 49lpx;
    z-index: 10;

    background: #aaa;
    border: none;
    padding: 8lpx 14lpx;
    font-size: 32lpx;
    cursor: pointer;

    box-shadow: 0 4lpx 12lpx rgba(0,0,0,0.15);
    transition: all 0.2s;

    border-radius: 50%;
    width: 72lpx;
    height: 72lpx;
}

.locator-btn:hover {
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@media (max-width: 480px) {
  .chapter-list {
    border-radius: 15px 15px 0 0;
  }
}
</style>