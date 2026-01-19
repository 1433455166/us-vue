<!-- src/components/Modal/ModalManager.vue -->
<template>
  <div class="modal-manager">
    <!-- 动态渲染所有弹窗 -->
    <template v-for="modal in modals" :key="modal.id">
      <component
        :is="modal.component"
        v-bind="modal.props"
        v-model="modal.visible"
        @close="handleClose(modal.id)"
        @confirm="handleConfirm(modal.id)"
        @cancel="handleCancel(modal.id)"
      >
        <!-- 传递插槽 -->
        <template v-if="modal.slots" v-for="(slotContent, slotName) in modal.slots" #[slotName]>
          <component :is="slotContent" />
        </template>
      </component>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, provide, markRaw, nextTick } from 'vue'
import BaseModal from './BaseModal.vue'
import AdvancedModal from './AdvancedModal.vue'

// 弹窗队列
const modals = ref([])

// 弹窗配置类型
const modalComponents = {
  base: markRaw(BaseModal),
  advanced: markRaw(AdvancedModal)
}

// 创建弹窗
const createModal = (options = {}) => {
  const {
    type = 'base',
    component,
    props = {},
    slots = {},
    duration = 0,
    priority = 0
  } = options
  
  const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const modal = {
    id,
    type,
    component: component || modalComponents[type] || modalComponents.base,
    props: {
      modelValue: false,
      ...props
    },
    slots,
    visible: false,
    duration,
    priority,
    createdAt: Date.now()
  }
  
  // 按优先级插入队列
  const index = modals.value.findIndex(m => m.priority < priority)
  if (index === -1) {
    modals.value.push(modal)
  } else {
    modals.value.splice(index, 0, modal)
  }
  
  // 显示弹窗
  nextTick(() => {
    modal.visible = true
    modal.props.modelValue = true
  })
  
  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      closeModal(id)
    }, duration)
  }
  
  return id
}

// 快速创建方法
const alert = (options) => {
  return createModal({
    type: 'advanced',
    props: {
      title: typeof options === 'string' ? options : options.title,
      content: typeof options === 'string' ? undefined : options.content,
      showFooter: false,
      showClose: false,
      closeOnClickMask: true,
      autoClose: true,
      autoCloseDelay: 2000
    },
    duration: 2000
  })
}

const confirm = (options) => {
  return new Promise((resolve, reject) => {
    const id = createModal({
      type: 'advanced',
      props: {
        title: typeof options === 'string' ? '提示' : options.title || '提示',
        content: typeof options === 'string' ? options : options.content,
        type: 'warning'
      },
      slots: {
        footer: {
          template: `
            <div class="custom-footer">
              <button @click="handleCancel" class="btn-cancel">取消</button>
              <button @click="handleConfirm" class="btn-confirm">确认</button>
            </div>
          `,
          setup() {
            const handleCancel = () => {
              closeModal(id)
              reject(new Error('用户取消'))
            }
            const handleConfirm = () => {
              closeModal(id)
              resolve(true)
            }
            return { handleCancel, handleConfirm }
          }
        }
      }
    })
  })
}

const prompt = (options) => {
  return new Promise((resolve, reject) => {
    let inputValue = ref(options.defaultValue || '')
    
    const id = createModal({
      type: 'advanced',
      props: {
        title: options.title || '请输入',
        content: options.content || ''
      },
      slots: {
        default: {
          template: `
            <div class="prompt-content">
              <input 
                v-model="inputValue" 
                :placeholder="placeholder"
                @keyup.enter="submit"
                autofocus
                class="prompt-input"
              />
            </div>
          `,
          setup() {
            const placeholder = options.placeholder || '请输入内容'
            const submit = () => {
              closeModal(id)
              resolve(inputValue.value)
            }
            return { inputValue, placeholder, submit }
          }
        },
        footer: {
          template: `
            <div class="prompt-footer">
              <button @click="cancel" class="btn-cancel">取消</button>
              <button @click="submit" class="btn-confirm">确认</button>
            </div>
          `,
          setup() {
            const cancel = () => {
              closeModal(id)
              reject(new Error('用户取消'))
            }
            const submit = () => {
              closeModal(id)
              resolve(inputValue.value)
            }
            return { cancel, submit }
          }
        }
      }
    })
  })
}

// 关闭弹窗
const closeModal = (id) => {
  const index = modals.value.findIndex(modal => modal.id === id)
  if (index !== -1) {
    modals.value[index].visible = false
    modals.value[index].props.modelValue = false
    
    // 延迟移除
    setTimeout(() => {
      modals.value.splice(index, 1)
    }, 300)
  }
}

const closeAll = () => {
  modals.value.forEach(modal => {
    modal.visible = false
    modal.props.modelValue = false
  })
  
  setTimeout(() => {
    modals.value = []
  }, 300)
}

// 事件处理
const handleClose = (id) => {
  closeModal(id)
}

const handleConfirm = (id) => {
  closeModal(id)
}

const handleCancel = (id) => {
  closeModal(id)
}

// 提供给子组件使用
provide('modalManager', {
  createModal,
  alert,
  confirm,
  prompt,
  closeModal,
  closeAll
})

// 暴露给全局
import { getCurrentInstance } from 'vue'

// 使用防抖确保只在组件挂载后设置
let globalModalSetup = false

const setupGlobalModal = () => {
  if (globalModalSetup) return
  
  const instance = getCurrentInstance()
  if (instance && instance.appContext) {
    instance.appContext.config.globalProperties.$modal = {
      create: createModal,
      alert,
      confirm,
      prompt,
      close: closeModal,
      closeAll
    }
    globalModalSetup = true
  }
}

// 在 nextTick 中设置，确保应用已初始化
nextTick(() => {
  setupGlobalModal()
})

defineExpose({
  createModal,
  alert,
  confirm,
  prompt,
  closeModal,
  closeAll
})
</script>

<style scoped>
.modal-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10000;
}

/* 自定义样式 */
.custom-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.prompt-content {
  padding: 0 24px;
}

.prompt-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.prompt-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.prompt-input::placeholder {
  color: #999;
}

.prompt-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.btn-cancel {
  padding: 10px 24px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-confirm {
  padding: 10px 24px;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .custom-footer,
  .prompt-footer {
    background: #1a1a1a;
    border-top-color: #333;
  }
  
  .btn-cancel {
    background: #2d2d2d;
    border-color: #444;
    color: #ccc;
  }
  
  .btn-cancel:hover {
    background: #333;
  }
  
  .prompt-input {
    background: #2d2d2d;
    border-color: #444;
    color: #e0e0e0;
  }
  
  .prompt-input:focus {
    border-color: #667eea;
  }
  
  .prompt-input::placeholder {
    color: #666;
  }
}
</style>