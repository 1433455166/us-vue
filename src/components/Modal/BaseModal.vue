<!-- src/components/Modal/BaseModal.vue -->
<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <transition name="modal-mask">
      <div 
        v-if="visible"
        class="modal-mask"
        :class="maskClass"
        @click.self="handleMaskClick"
      ></div>
    </transition>
    
    <!-- 弹窗内容 -->
    <transition :name="contentTransition" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
      <div 
        v-if="visible"
        ref="modalRef"
        class="modal-container"
        :class="containerClass"
        :style="containerStyle"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @keydown.esc="handleEsc"
        tabindex="-1"
      >
        <!-- 关闭按钮 -->
        <button 
          v-if="showClose"
          class="modal-close"
          @click="handleClose"
          aria-label="关闭弹窗"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
        
        <!-- 弹窗内容插槽 -->
        <div class="modal-content">
          <slot>
            <!-- 如果没有插槽，渲染传入的 content -->
            <div v-if="content" class="modal-content-html" v-html="content"></div>
            <div v-else-if="$slots.default">
              <slot name="default"></slot>
            </div>
          </slot>
        </div>
        
        <!-- 底部按钮区域 -->
        <div v-if="showFooter" class="modal-footer">
          <slot name="footer">
            <!-- <button class="btn-cancel" @click="handleCancel">取消</button> -->
            <button class="btn-confirm" @click="handleConfirm">确认</button>
          </slot>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 控制显示
  modelValue: {
    type: Boolean,
    default: false
  },
  
  // 内容相关
  title: String,
  content: [String, Object], // 支持字符串或对象
  titleId: {
    type: String,
    default: () => `modal-title-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // 配置选项
  showClose: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  closeOnClickMask: {
    type: Boolean,
    default: true
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  lockScroll: {
    type: Boolean,
    default: true
  },
  
  // 样式配置
  width: {
    type: [String, Number],
    default: '520px'
  },
  maxWidth: {
    type: String,
    default: '100vw'
  },
  maxHeight: {
    type: String,
    default: '100vh'
  },
  customClass: String,
  maskClass: [String, Array, Object],
  
  // 动画配置
  animation: {
    type: Boolean,
    default: true
  },
  animationType: {
    type: String,
    default: 'zoom',
    validator: (value) => ['zoom', 'slide', 'fade', 'bounce', 'none'].includes(value)
  },
  animationDuration: {
    type: Number,
    default: 300
  },
  enterDelay: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:modelValue',
  'open',
  'opened',
  'close',
  'closed',
  'confirm',
  'cancel',
  'mask-click'
])

const visible = ref(false)
const modalRef = ref(null)
const isAnimating = ref(false)

// 计算属性
const containerStyle = computed(() => {
  const styles = {}
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.maxWidth) {
    styles.maxWidth = props.maxWidth
  }
  
  if (props.maxHeight) {
    styles.maxHeight = props.maxHeight
  }
  
  return styles
})

const containerClass = computed(() => {
  const classes = []
  
  if (props.customClass) {
    classes.push(props.customClass)
  }
  
  return classes
})

const contentTransition = computed(() => {
  if (!props.animation || props.animationType === 'none') {
    return ''
  }
  return `modal-content-${props.animationType}`
})

// 方法
const handleMaskClick = () => {
  emit('mask-click')
  if (props.closeOnClickMask) {
    handleClose()
  }
}

const handleClose = () => {
    visible.value = false  // 添加这行
    emit('update:modelValue', false);
    emit('close');
}

const handleCancel = () => {
  emit('cancel')
  handleClose()
}

const handleConfirm = () => {
  emit('confirm')
  handleClose()
}

const handleEsc = (event) => {
  if (props.closeOnPressEscape) {
    event.preventDefault()
    handleClose()
  }
}

const onAfterEnter = () => {
  isAnimating.value = false
  emit('opened')
  
  // 自动聚焦到弹窗
  nextTick(() => {
    if (modalRef.value) {
      modalRef.value.focus()
    }
  })
}

const onAfterLeave = () => {
  isAnimating.value = false
  visible.value = false  // 添加这行
  emit('closed')
}

// 锁定页面滚动
const lockBodyScroll = () => {
  if (props.lockScroll) {
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${getScrollbarWidth()}px`
  }
}

const unlockBodyScroll = () => {
  if (props.lockScroll) {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

const getScrollbarWidth = () => {
  return window.innerWidth - document.documentElement.clientWidth
}

// 生命周期
watch(() => props.modelValue, (newVal) => {
  if (newVal && !visible.value) {
    // 打开弹窗
    visible.value = true
    isAnimating.value = true
    lockBodyScroll()
    emit('open')
    
    // 如果有延迟，延迟显示
    if (props.enterDelay > 0) {
      setTimeout(() => {
        isAnimating.value = false
      }, props.enterDelay)
    }
  } else if (!newVal && visible.value) {
    // 关闭弹窗 - 这里需要设置 isAnimating，但 visible 会在动画结束后才设置为 false
    isAnimating.value = true
    unlockBodyScroll()
    
    // 等待动画完成后再隐藏
    // 注意：这里不能立即设置 visible.value = false，因为动画需要时间
  }
}, { immediate: true })

onMounted(() => {
  // 监听键盘事件
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  unlockBodyScroll()
})

// 暴露方法给父组件
defineExpose({
  open: () => {
    emit('update:modelValue', true)
  },
  close: handleClose,
  visible,
  modalRef
})
</script>

<style scoped>
/* 遮罩层 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

/* 遮罩层动画 */
.modal-mask-enter-active,
.modal-mask-leave-active {
  transition: opacity 0.3s ease;
}

.modal-mask-enter-from,
.modal-mask-leave-to {
  opacity: 0;
}

/* 弹窗容器 */
.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 12px;
  overflow: hidden;
  z-index: 9999;
  outline: none;
}

/* 弹窗内容区域 */
.modal-content {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    padding: 24lpx;
    color: #e0e0e0;
    margin-top: 81lpx;
}

.modal-content-html {
  line-height: 1.6;
}

/* 关闭按钮 */
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1;
  padding: 0;
}

.modal-close:hover {
  background: #e0e0e0;
  color: #333;
  transform: rotate(90deg);
}

/* 底部区域 */
.modal-footer {
  padding: 32lpx 100lpx;
  display: flex;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  border: 1px solid #ddd;
  background: white;
  color: #666;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-confirm {
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* ========== 动画效果 ========== */

/* 缩放动画 */
.modal-content-zoom-enter-active {
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-zoom-leave-active {
  animation: zoomOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes zoomOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }
}

/* 滑动动画 */
.modal-content-slide-enter-active {
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-slide-leave-active {
  animation: slideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
}

/* 淡入淡出动画 */
.modal-content-fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.modal-content-fade-leave-active {
  animation: fadeOut 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* 弹性动画 */
.modal-content-bounce-enter-active {
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.modal-content-bounce-leave-active {
  animation: bounceOut 0.3s ease;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
  70% {
    transform: translate(-50%, -50%) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes bounceOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.7);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-container {
    width: 100vw !important;
    margin: 0 auto;
    border-radius: 16px 16px 0 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    transform: translateY(0);
    max-height: 85vh;
  }
  
  /* 移动端动画 */
  .modal-content-slide-enter-active {
    animation: slideUpIn 0.3s ease;
  }
  
  .modal-content-slide-leave-active {
    animation: slideUpOut 0.3s ease;
  }
  
  @keyframes slideUpIn {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  @keyframes slideUpOut {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }
  
  .btn-cancel,
  .btn-confirm {
    flex: 1;
    padding: 12px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .modal-close {
    background: #333;
    color: #999;
  }
  
  .modal-close:hover {
    background: #444;
    color: #ccc;
  }
  
  .btn-cancel {
    background: #2d2d2d;
    border-color: #444;
    color: #ccc;
  }
  
  .btn-cancel:hover {
    background: #333;
  }
}
</style>