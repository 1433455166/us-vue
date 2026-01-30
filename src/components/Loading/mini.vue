<template>
  <span class="mini-loader" :class="{ 'is-loading': loading }">
    <svg 
      v-if="loading"
      class="mini-spinner"
      :width="size"
      :height="size"
      viewBox="0 0 20 20"
      fill="none"
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <span v-else>
      <slot></slot>
    </span>
  </span>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 16
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})
</script>

<style scoped>
.mini-loader {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.3s ease;
}

.mini-spinner {
  animation: mini-rotate 0.8s linear infinite;
}

@keyframes mini-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.mini-loader circle {
  stroke-dasharray: 50;
  stroke-dashoffset: 10;
}
</style>