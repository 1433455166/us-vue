<template>
  <svg :viewBox="'0 0 24 24'" :width="size" :height="size" fill="currentColor" v-bind="$attrs">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z"></path>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 24 },
});
</script>
