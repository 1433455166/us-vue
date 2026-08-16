<template>
  <svg :viewBox="'0 0 24 24'" :width="size" :height="size" fill="currentColor" v-bind="$attrs">
    <path d="M8 5v14l11-7z"></path>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 24 },
});
</script>
