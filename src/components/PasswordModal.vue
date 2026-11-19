<!-- src/components/PasswordModal.vue -->
<template>
  <BaseModal
    v-model="visibleModel"
    title="访问密码"
    :animation="true"
    animation-type="zoom"
    width="320px"
    mask-class="password-modal-mask"
    custom-class="password-modal-card"
    :close-on-click-mask="false"
    :show-footer="false"
  >
    <div class="password-wrap">
      <div class="password-box">
        <input
          ref="inputRef"
          v-model="password"
          type="password"
          class="password-input"
          :placeholder="locked ? '系统错误，明日重试' : '请输入访问密码'"
          :disabled="locked"
          autocomplete="off"
          @keyup.enter="confirm"
        />
        <p v-if="locked" class="password-error-tip">系统错误，明日重试</p>
      </div>
      <div class="password-footer">
        <button class="password-confirm" :disabled="locked" @click="confirm">验证</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import BaseModal from './Modal/BaseModal.vue'
import { getPasswordLevel, PASSWORD_LEVEL } from '../common/const'
import Cookies from 'js-cookie'
import message from '../utils/message'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visibleModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const password = ref('')
const inputRef = ref(null)

// ===== 每日错误次数记录（localStorage，跨天自动重置）=====
const ERROR_LIMIT = 5
const ERROR_STORAGE_KEY = 'passwordModalErrorRecord'

const errorCount = ref(0)
const locked = ref(false)

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 读取当日错误次数，记录不是今天的则视为 0
const loadErrorCount = () => {
  try {
    const record = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || 'null')
    if (record && record.date === todayStr()) {
      return Number(record.count) || 0
    }
  } catch (e) { /* 忽略脏数据 */ }
  return 0
}

const saveErrorCount = () => {
  try {
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify({ date: todayStr(), count: errorCount.value }))
  } catch (e) { /* 忽略存储失败 */ }
}

// 打开时清空输入、刷新锁定状态并自动聚焦
watch(() => props.modelValue, (val) => {
  if (val) {
    password.value = ''
    errorCount.value = loadErrorCount()
    locked.value = errorCount.value >= ERROR_LIMIT
    if (!locked.value) {
      nextTick(() => inputRef.value?.focus())
      // BaseModal 会在入场动画结束后聚焦弹窗容器，覆盖输入框焦点，这里延迟到动画结束后再聚焦回来
      setTimeout(() => {
        if (!locked.value) {
          inputRef.value?.focus()
        }
      }, 350)
    }
  }
})

// 验证密码：等级大于访客即通过，写入 cookie 并通知父组件；错误计数达到上限后当日锁定
const confirm = () => {
  if (locked.value) {
    message.error('系统错误，明日重试')
    return
  }
  const level = getPasswordLevel(password.value)
  if (level > PASSWORD_LEVEL.GUEST) {
    Cookies.set('accessPassword', password.value, { expires: 1 })
    emit('success')
    visibleModel.value = false
  } else if (password.value) {
    errorCount.value += 1
    saveErrorCount()
    if (errorCount.value >= ERROR_LIMIT) {
      locked.value = true
      message.error('系统错误，明日重试')
    } else {
      message.error(`密码错误，还可尝试 ${ERROR_LIMIT - errorCount.value} 次`)
    }
    password.value = ''
  }
}
</script>

<style scoped>
.password-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #000;
  padding: 24px;
  border-radius: 8px;
}

.password-box {
  text-align: center;
  margin-top: 24px;
}

.password-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  outline: none;
  color: #fff;
  transition: border-color 0.2s ease;
}

.password-input:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.password-input:disabled {
  border-color: #999;
  cursor: not-allowed;
}

.password-error-tip {
  margin: 10px 0 0;
  font-size: 13px;
  color: #ff7e7e;
}

.password-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.password-footer {
  display: flex;
  justify-content: flex-end;
}

.password-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  transition: opacity 0.2s;
  flex: 1;
}

.password-confirm:hover {
  opacity: 0.9;
}
</style>

<style>
/* 遮罩背景：白 -> 金 -> 蓝 三色渐变（与站点主题渐变一致）
   双类名提高特异性，覆盖 BaseModal scoped 的 .modal-mask[data-v-xxx] 背景 */
.modal-mask.password-modal-mask {
  background: linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #4a90e2 100%);
}
</style>
