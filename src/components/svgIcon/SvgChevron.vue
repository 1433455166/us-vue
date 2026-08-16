<template>
  <svg :viewBox="'0 0 24 24'" :width="size" :height="size" fill="currentColor" v-bind="$attrs">
    <path :d="path"></path>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: { type: [Number, String], default: 24 },
  direction: { type: String, default: 'right' }, // 'left' | 'right' | 'up' | 'down'
});

const paths = {
  left: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  up: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z',
};

const path = computed(() => paths[props.direction] || paths.right);
</script>
