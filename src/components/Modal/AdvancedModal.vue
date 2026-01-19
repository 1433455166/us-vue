<!-- src/components/Modal/AdvancedModal.vue -->
<template>
  <BaseModal
    ref="modalRef"
    v-bind="baseProps"
    @update:modelValue="handleModelValue"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <!-- 标题插槽 -->
    <template v-if="$slots.header || title || description" #header>
      <slot name="header">
        <div class="modal-header" :class="{ 'has-icon': showIcon && iconConfig }">
          <!-- 图标区域 -->
          <div v-if="showIcon && iconConfig" class="modal-icon-wrapper">
            <div class="modal-icon" :style="{ backgroundColor: iconConfig.bg, color: iconConfig.color }">
              {{ iconConfig.icon }}
            </div>
          </div>
          
          <!-- 标题区域 -->
          <div class="modal-header-content">
            <h3 v-if="title" :id="titleId" class="modal-title">{{ title }}</h3>
            <p v-if="description" class="modal-description">{{ description }}</p>
          </div>
        </div>
      </slot>
    </template>
    
    <!-- 内容插槽 -->
    <template v-if="$slots.default">
      <slot></slot>
    </template>
    
    <div v-else-if="content" class="modal-custom-content" v-html="content"></div>
    
    <!-- 底部插槽 -->
    <template v-if="$slots.footer || showDefaultFooter" #footer>
      <slot name="footer">
        <div class="modal-default-footer">
          <button 
            v-if="showCancel"
            class="btn-cancel"
            :class="{ 'btn-loading': loading }"
            :disabled="loading || confirmLoading"
            @click="handleCancel"
          >
            <span v-if="loading" class="loading-spinner"></span>
            {{ cancelText }}
          </button>
          <button 
            class="btn-confirm"
            :class="[
              `btn-${type}`,
              { 'btn-loading': confirmLoading }
            ]"
            :disabled="loading || confirmLoading"
            @click="handleConfirm"
          >
            <span v-if="confirmLoading" class="loading-spinner"></span>
            {{ confirmText }}
          </button>
        </div>
      </slot>
    </template>
    
    <!-- 自定义关闭按钮插槽 -->
    <template v-if="$slots.close" #close>
      <slot name="close"></slot>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  // 继承 BaseModal 的所有属性
  modelValue: {
    type: Boolean,
    default: false
  },
  
  // 内容相关
  title: String,
  description: String,
  content: String,
  
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
    default: '90vw'
  },
  maxHeight: {
    type: String,
    default: '80vh'
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
  },
  
  // 扩展属性
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'success', 'warning', 'error', 'info'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmLoading: {
    type: Boolean,
    default: false
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  autoClose: {
    type: Boolean,
    default: false
  },
  autoCloseDelay: {
    type: Number,
    default: 3000
  },
  beforeClose: Function,
  destroyOnClose: {
    type: Boolean,
    default: false
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
  'mask-click',
  'loading-change',
  'confirm-loading-change'
])

const modalRef = ref(null)

// 计算属性
const baseProps = computed(() => {
  // 筛选出 BaseModal 需要的属性
  const {
    description,
    type,
    icon,
    showIcon,
    loading,
    confirmText,
    cancelText,
    confirmLoading,
    showCancel,
    autoClose,
    autoCloseDelay,
    ...rest
  } = props
  
  return rest
})

const showDefaultFooter = computed(() => {
  return props.showFooter && !props.$slots.footer
})

// 图标配置
const iconConfig = computed(() => {
  if (props.icon) {
    return {
      icon: props.icon,
      color: '#1890ff',
      bg: '#e6f7ff'
    }
  }
  
  const config = {
    default: { icon: 'ℹ️', color: '#1890ff', bg: '#e6f7ff' },
    success: { icon: '✅', color: '#52c41a', bg: '#f6ffed' },
    warning: { icon: '⚠️', color: '#faad14', bg: '#fffbe6' },
    error: { icon: '❌', color: '#f5222d', bg: '#fff2f0' },
    info: { icon: '💡', color: '#1890ff', bg: '#e6f7ff' }
  }
  return config[props.type] || config.default
})

// 自动关闭定时器
let autoCloseTimer = null

const startAutoClose = () => {
  if (props.autoClose && props.modelValue) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = setTimeout(() => {
      close()
    }, props.autoCloseDelay)
  }
}

const stopAutoClose = () => {
  clearTimeout(autoCloseTimer)
}

// 事件处理
const handleModelValue = (value) => {
  emit('update:modelValue', value)
  
  if (value) {
    startAutoClose()
  } else {
    stopAutoClose()
  }
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

// 暴露方法
const open = () => {
  if (modalRef.value) {
    modalRef.value.open()
  }
}

const close = () => {
  if (modalRef.value) {
    modalRef.value.close()
  }
}

const toggle = () => {
  if (modalRef.value) {
    modalRef.value.visible ? close() : open()
  }
}

// 监听变化
watch(() => props.modelValue, (value) => {
  if (value) {
    startAutoClose()
  }
})

// 监听 loading 状态
watch(() => props.loading, (value) => {
  emit('loading-change', value)
})

watch(() => props.confirmLoading, (value) => {
  emit('confirm-loading-change', value)
})

// 清理
onUnmounted(() => {
  stopAutoClose()
})

defineExpose({
  open,
  close,
  toggle,
  modalRef
})
</script>

<style scoped>
/* 头部区域 */
.modal-header {
  padding: 24px 24px 16px;
  text-align: center;
}

.modal-header.has-icon {
  padding-top: 32px;
}

.modal-icon-wrapper {
  margin-bottom: 16px;
}

.modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.modal-header-content {
  max-width: 100%;
}

.modal-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  word-break: break-word;
}

.modal-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

/* 自定义内容 */
.modal-custom-content {
  padding: 0 24px;
  color: #333;
  line-height: 1.6;
}

/* 底部按钮 */
.modal-default-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
  position: relative;
  min-width: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.btn-cancel:hover:not(:disabled) {
  background: #e8e8e8;
  border-color: #ccc;
  color: #333;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 确认按钮类型 */
.btn-confirm {
  color: white;
  border: none;
}

.btn-default {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.btn-success {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.btn-warning {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.btn-error {
  background: linear-gradient(135deg, #f5222d, #ff4d4f);
}

.btn-info {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.btn-cancel .loading-spinner {
  border: 2px solid rgba(102, 102, 102, 0.3);
  border-top-color: #666;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-loading {
  cursor: wait;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-header {
    padding: 20px 20px 12px;
  }
  
  .modal-header.has-icon {
    padding-top: 24px;
  }
  
  .modal-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-description {
    font-size: 13px;
  }
  
  .modal-custom-content {
    padding: 0 20px;
  }
  
  .modal-default-footer {
    flex-direction: column;
    width: 100%;
  }
  
  .btn-cancel,
  .btn-confirm {
    width: 100%;
    padding: 12px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .modal-title {
    color: #e0e0e0;
  }
  
  .modal-description {
    color: #999;
  }
  
  .modal-custom-content {
    color: #e0e0e0;
  }
  
  .btn-cancel {
    background: #2d2d2d;
    border-color: #444;
    color: #ccc;
  }
  
  .btn-cancel:hover:not(:disabled) {
    background: #333;
    border-color: #555;
    color: #e0e0e0;
  }
}
</style>