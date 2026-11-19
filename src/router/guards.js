// src/router/guards.js
import { createApp, h } from 'vue';
import Cookies from 'js-cookie';
import PasswordGuard from '../components/PasswordGuard.vue';
import { getPasswordLevel, PASSWORD_LEVEL } from '../common/const';

// 挂载 PasswordGuard 密码弹窗，验证成功后触发 onSuccess 并自动清理
export const showPasswordGuard = (onSuccess = () => {}) => {
  // 创建一个 Vue 应用实例
  const app = createApp({
    setup() {
      return () => h(PasswordGuard, {
        onSuccess: () => {
          // 清理
          const modalElement = document.getElementById('password-guard-modal');
          if (modalElement) {
            app.unmount();
            document.body.removeChild(modalElement);
          }

          onSuccess();
        },
      });
    },
  });

  // 挂载到一个临时的 DOM 元素
  const modal = document.createElement('div');
  modal.id = 'password-guard-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(233, 233, 233, 0.81)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  document.body.appendChild(modal);

  app.mount(modal);
//   console.log('app', app, modal); // 调试信息
};

export const passwordGuard = (to, from, next) => {
//   console.log('Password guard triggered for', to.path); // 调试信息
    // 检查 cookie
    const storedPassword = Cookies.get('accessPassword');
    if (getPasswordLevel(storedPassword) > PASSWORD_LEVEL.GUEST) {
        next();
        return;
    }

    showPasswordGuard(() => next());
};
