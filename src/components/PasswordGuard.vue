<template>
  <div class="password-guard">
    <h2 class="password-guard-h2">请输入访问密码</h2>
    <input
        type="password"
        v-model="password"
        placeholder="密码"
        class="password-guard-input"
    />
    <button @click="checkPassword" class="password-guard-btn">
        验证
    </button>
  </div>
</template>

<script>
import { accessPassword } from '../common/const';
import Cookies from 'js-cookie';
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
        // 密码错误，跳转到谷歌首页
        // window.location.href = 'https://www.google.com';
      }
    },
  },
};
</script>

<style scoped>
.password-guard {
    display: block;
};

.password-guard-h2 {
    color: darkgreen;
}

.password-guard-input {
    /* height: 42px; */
    background-color: cornflowerblue
}
.password-guard-btn {
    margin-left: 10px;
    font-size: 10px;
}
</style>
