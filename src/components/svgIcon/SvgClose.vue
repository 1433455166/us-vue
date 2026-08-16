<template>
  <svg :viewBox="'0 0 24 24'" :width="size" :height="size" v-bind="$attrs">
    <!-- 实心 X：Modal / 章节列表关闭按钮 -->
    <path
      v-if="variant === 'fill'"
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="currentColor"
    ></path>
    <!-- 细线 X：播放器弹层面板关闭按钮 -->
    <template v-else>
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line>
    </template>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 24 },
  variant: { type: String, default: 'fill' }, // 'fill' | 'line'
});
</script>
