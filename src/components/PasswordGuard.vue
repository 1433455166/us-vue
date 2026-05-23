<template>
  <div class="password-guard">
    <h2 class="password-guard-h2">请输入访问密码</h2>
    <form @submit.prevent="checkPassword" class="password-form">
      <div class="input-button-container">
        <input
            type="password"
            :value="password"
            @input="handleInput"
            placeholder="密码"
            class="password-guard-input"
            autocomplete="off"
        />
        <button type="submit" class="password-guard-btn">
            验证
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { accessPassword } from '../common/const'
import Cookies from 'js-cookie'
import message from '../utils/message'

// 定义响应式数据
const password = ref('')
const emit = defineEmits(['success'])

// 处理输入事件
const handleInput = (event) => {
  password.value = event.target.value
}

// 验证密码
const checkPassword = () => {
  if (password.value === accessPassword) {
    // 密码正确，继续访问
    emit('success')
    // 设置 cookie
    Cookies.set('accessPassword', accessPassword, { expires: 1 }) // 有效期为1天
  } else if (password.value === '') {} else {
    // 密码错误，显示提示信息
    message.error('密码错误，请联系开发大师')
    // 清空密码输入框
    password.value = ''
  }
}
</script>

<style scoped>
.password-guard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 30px;
    /* max-width: 400px; */
    width: 100%;
    margin-top: 49vw;
    z-index: 1000;
    position: relative;
}

.password-guard-h2 {
    background: linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #4a90e2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    margin: 0;
    font-size: 24px;
    text-align: center;
    line-height: 1.2;
}

.password-form {
    width: 100%;
    display: flex;
    justify-content: center;
}

.password-guard-input {
    background-color: #e6f0ff;
    color: #333;
    padding: 12px;
    border: 2px solid #667eea;
    border-radius: 8px;
    width: 100%;
    max-width: 250px;
    font-size: 16px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s ease;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    box-sizing: border-box;
}

.password-guard-input:focus {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.password-guard-btn {
    margin-left: 10px;
    font-size: 16px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 100px;
    font-weight: bold;
    box-sizing: border-box;
}

.password-guard-btn:hover {
    transform: scale(1.05);
}

/* 输入框和按钮的容器 */
.input-button-container {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    justify-content: center;
}
</style>