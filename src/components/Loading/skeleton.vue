<template>
  <div class="skeleton-loader" :style="loaderStyle">
    <svg 
      :width="width"
      :height="height"
      viewBox="0 0 400 200"
      preserveAspectRatio="none"
    >
      <!-- 矩形骨架 -->
      <rect 
        x="0" 
        y="0" 
        width="400" 
        height="200" 
        fill="url(#skeleton-gradient)" 
        rx="8"
        ry="8"
      />
      
      <!-- 内容骨架 -->
      <rect x="30" y="30" width="120" height="20" rx="4" ry="4" fill="url(#skeleton-gradient)" />
      <rect x="30" y="70" width="340" height="12" rx="4" ry="4" fill="url(#skeleton-gradient)" />
      <rect x="30" y="90" width="300" height="12" rx="4" ry="4" fill="url(#skeleton-gradient)" />
      <rect x="30" y="110" width="280" height="12" rx="4" ry="4" fill="url(#skeleton-gradient)" />
      
      <defs>
        <linearGradient id="skeleton-gradient">
          <stop offset="0%" stop-color="#f0f0f0">
            <animate attributeName="offset" values="-2; 1" dur="1.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stop-color="#e0e0e0">
            <animate attributeName="offset" values="-1; 1" dur="1.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stop-color="#f0f0f0">
            <animate attributeName="offset" values="0; 2" dur="1.5s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup>
const props = defineProps({
  width: {
    type: [String, Number],
    default: 400
  },
  height: {
    type: [String, Number],
    default: 200
  },
  borderRadius: {
    type: [String, Number],
    default: 8
  }
})

const loaderStyle = {
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  borderRadius: `${props.borderRadius}px`,
  overflow: 'hidden'
}
</script>

<style scoped>
.skeleton-loader {
  background: #f8f9fa;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>