<template>
  <div class="chapter-wrapper">
    <div
      class="chapter-item"
      :class="{ active: chapter.id === currentId }"
      :data-id="chapter.id"
      @click="handleToggle"
      :style="{ justifyContent: chapter.volumeId ? 'center' : 'space-between' }"
    >
      <div class="item-main">
        <!-- 展开箭头 -->
        <span v-if="hasChildren" class="arrow">
          {{ isExpanded ? "▼" : "▶" }}
        </span>

        <span v-if="chapter.id" @click.stop="selectChapter(chapter.id)">
          第{{ chapter.id }}章
        </span>
      </div>

      <span
        class="chapter-title"
        @click="chapter.id && selectChapter(chapter.id)"
      >
        {{ chapter.title }}
      </span>

      <div class="item-meta" v-if="chapter.wordCount">
        <span class="word-count">
          {{ chapter.wordCount }}字
        </span>
      </div>
    </div>

    <!-- 子节点 -->
    <div
      v-if="hasChildren && isExpanded"
      class="children"
    >
      <ChapterItem
        v-for="child in chapter.chapters"
        :key="child.id"
        :chapter="child"
        :currentId="currentId"
        :expandedMap="expandedMap"
        @select="selectChapter"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import ChapterItem from "./ChapterItem.vue"

const props = defineProps({
  chapter: Object,
  currentId: Number,
  expandedMap: Object,
  setItemRef: Function,
})

const emit = defineEmits(["select"])

const nodeKey = computed(() => {
  return props.chapter.id || props.chapter.volumeId
})

const hasChildren = computed(() => {
  return props.chapter.chapters?.length > 0
})

const isExpanded = computed(() => {
  return props.expandedMap?.[nodeKey.value]
})

const handleToggle = () => {
  if (!hasChildren.value) return
  props.expandedMap[nodeKey.value] =
    !props.expandedMap?.[nodeKey.value]
}

const selectChapter = (id) => {
  emit("select", id)
}
</script>
<style scoped>
.chapter-item {
    display: flex;
    justify-content: space-between;
    padding: 12lpx 24lpx;
    line-height: 64lpx;
    border-top: 3lpx solid #eee;
}

.chapter-wrapper:first-child {
    border-top: none;
}

.chapter-title {
    width: 250lpx;
    font-weight: 900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.arrow {
    margin-right: 12lpx;
}
</style>


