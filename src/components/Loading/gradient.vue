<template>
  <div class="gradient-loader" :style="containerStyle">
    <svg 
      :width="size"
      :height="size"
      viewBox="0 0 50 50"
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="colors[0]" />
          <stop offset="50%" :stop-color="colors[1]" />
          <stop offset="100%" :stop-color="colors[2]" />
        </linearGradient>
      </defs>
      <circle
        class="gradient-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#gradient)"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
    </svg>
    
    <span v-if="text" class="gradient-text">
      {{ text }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: Number,
    default: 60
  },
  colors: {
    type: Array,
    default: () => ['#667eea', '#764ba2', '#f093fb']
  },
  strokeWidth: {
    type: Number,
    default: 4
  },
  text: {
    type: String,
    default: ''
  },
  speed: {
    type: Number,
    default: 1.5
  }
})

const containerStyle = computed(() => ({
  '--speed': `${props.speed}s`
}))
</script>

<style scoped>
.gradient-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.gradient-path {
  transform-origin: center;
  animation: gradient-rotate var(--speed) linear infinite;
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
}

@keyframes gradient-rotate {
  0% {
    transform: rotate(0deg);
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    transform: rotate(360deg);
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}

.gradient-text {
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(90deg, v-bind('colors[0]'), v-bind('colors[1]'), v-bind('colors[2]'));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>