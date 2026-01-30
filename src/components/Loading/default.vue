<template>
  <div class="svg-loader" :style="containerStyle" :class="containerClass">
    <!-- 多种SVG动画选择 -->
    <svg 
      v-if="type === 'spinner'"
      :width="size"
      :height="size"
      viewBox="0 0 50 50"
      :style="svgStyle"
    >
      <circle
        class="spinner-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
      />
    </svg>
    
    <svg 
      v-else-if="type === 'dots'"
      :width="size"
      :height="size"
      viewBox="0 0 120 30"
      :style="svgStyle"
    >
      <circle class="dot" cx="15" cy="15" r="12" :fill="color">
        <animate
          attributeName="opacity"
          from="1"
          to="0.2"
          dur="1s"
          begin="0.1"
          repeatCount="indefinite"
        />
      </circle>
      <circle class="dot" cx="60" cy="15" r="12" :fill="color">
        <animate
          attributeName="opacity"
          from="1"
          to="0.2"
          dur="1s"
          begin="0.2"
          repeatCount="indefinite"
        />
      </circle>
      <circle class="dot" cx="105" cy="15" r="12" :fill="color">
        <animate
          attributeName="opacity"
          from="1"
          to="0.2"
          dur="1s"
          begin="0.3"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    
    <svg 
      v-else-if="type === 'ring'"
      :width="size"
      :height="size"
      viewBox="0 0 40 40"
      :style="svgStyle"
    >
      <circle
        class="ring-track"
        cx="20"
        cy="20"
        r="15.915"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <circle
        class="ring-fill"
        cx="20"
        cy="20"
        r="15.915"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-dasharray="100"
        stroke-dashoffset="75"
      />
    </svg>
    
    <svg 
      v-else-if="type === 'pulse'"
      :width="size"
      :height="size"
      viewBox="0 0 60 60"
      :style="svgStyle"
    >
      <circle
        class="pulse-circle"
        cx="30"
        cy="30"
        r="20"
        :fill="color"
        fill-opacity="0.8"
      >
        <animate
          attributeName="r"
          from="10"
          to="25"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="1"
          to="0"
          dur="1.5s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    
    <svg 
      v-else-if="type === 'grid'"
      :width="size"
      :height="size"
      viewBox="0 0 105 105"
      :style="svgStyle"
    >
      <circle cx="12.5" cy="12.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="0s" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="12.5" cy="52.5" r="12.5" :fill="color" fill-opacity=".5">
        <animate attributeName="fill-opacity" begin="100ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="52.5" cy="12.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="300ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="52.5" cy="52.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="600ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="92.5" cy="12.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="800ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="92.5" cy="52.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="400ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="12.5" cy="92.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="700ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="52.5" cy="92.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="500ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
      <circle cx="92.5" cy="92.5" r="12.5" :fill="color">
        <animate attributeName="fill-opacity" begin="200ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
      </circle>
    </svg>
    
    <!-- 文本提示 -->
    <span v-if="text" class="loader-text" :style="{ color: textColor }">
      {{ text }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 动画类型
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'ring', 'pulse', 'grid'].includes(value)
  },
  
  // 尺寸
  size: {
    type: [String, Number],
    default: 40
  },
  
  // 主颜色
  color: {
    type: String,
    default: '#4a6cf7'
  },
  
  // 轨道颜色（仅ring类型）
  trackColor: {
    type: String,
    default: '#e9ecef'
  },
  
  // 描边宽度
  strokeWidth: {
    type: [String, Number],
    default: 4
  },
  
  // 是否居中显示
  center: {
    type: Boolean,
    default: false
  },
  
  // 是否内联显示
  inline: {
    type: Boolean,
    default: false
  },
  
  // 加载文本
  text: {
    type: String,
    default: ''
  },
  
  // 文本颜色
  textColor: {
    type: String,
    default: '#666'
  },
  
  // 自定义容器类名
  containerClass: {
    type: String,
    default: ''
  }
})

// 计算样式
const containerStyle = computed(() => ({
  display: props.inline ? 'inline-flex' : 'flex',
  justifyContent: props.center ? 'center' : 'flex-start',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '12px'
}))

const svgStyle = computed(() => ({
  display: 'block'
}))
</script>

<style scoped>
.svg-loader {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 旋转动画 */
.spinner-path {
  transform-origin: center;
  animation: spinner-rotate 1.5s linear infinite;
}

@keyframes spinner-rotate {
  0% {
    transform: rotate(0deg);
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    transform: rotate(360deg);
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 环形加载动画 */
.ring-fill {
  transform-origin: center;
  transform: rotate(-90deg);
  animation: ring-rotate 1.5s ease-in-out infinite;
}

@keyframes ring-rotate {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 加载文本 */
.loader-text {
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .loader-text {
    font-size: 13px;
  }
}
</style>