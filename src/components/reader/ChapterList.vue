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
      
      <div class="list-content" ref="listRef">
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

        <!-- 定位器 -->
        <button
            v-show="showLocator"
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

const expandedMap = reactive({})

const props = defineProps({
  chapters: Array,
  currentId: Number
});

const emit = defineEmits(['select-chapter', 'close'])

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

    // const visible =
    // itemEl.offsetTop >= listEl.scrollTop &&
    // itemEl.offsetTop + itemEl.offsetHeight <=
    //     listEl.scrollTop + listEl.clientHeight;

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
  padding: 0;
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
    padding: 12lpx 18lpx;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;
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
  font-size: 24lpx;
  color: #666;
  width: 100lpx;
}

.chapter-title {
    display: inline-block;
    font-size: 30lpx;
    color: #333;
    font-weight: 500;
    width: 308lpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
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
