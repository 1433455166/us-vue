<template>
  <div class="password-guard">
    <h2 class="password-guard-h2">请输入访问密码</h2>
    <div class="input-button-container">
      <input
          type="password"
          v-model="password"
          placeholder="密码"
          class="password-guard-input"
          @keyup.enter="checkPassword"
      />
      <button @click="checkPassword" class="password-guard-btn">
          验证
      </button>
    </div>
  </div>
</template>

<script>
import { accessPassword } from '../common/const';
import Cookies from 'js-cookie';
import message from '../utils/message';

export default {
  data() {
    return {
      password: '',
    };
  },
  mounted() {
    // console.log('PasswordGuard component mounted');
  },
  methods: {
    checkPassword() {
      if (this.password === accessPassword) {
        // 密码正确，继续访问
        this.$emit('success');
        // 设置 cookie
        Cookies.set('accessPassword', accessPassword, { expires: 1 }); // 有效期为1天

      } else {
        // 密码错误，显示提示信息
        message.error('密码错误，请联系开发大师');
        // 清空密码输入框
        this.password = '';
      }
    },
  },
};
</script>

<style scoped>
.password-guard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 30px;
    max-width: 400px;
    width: 100%;
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
}

.password-guard-input {
    background-color: cornflowerblue;
    padding: 12px;
    border: none;
    border-radius: 8px;
    width: 100%;
    max-width: 250px;
    font-size: 16px;
    text-align: center;
}

.password-guard-btn {
    margin-left: 10px;
    font-size: 16px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 100px;
}

.password-guard-btn:hover {
    transform: scale(1.05);
}

/* 输入框和按钮的容器 */
.input-button-container {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>