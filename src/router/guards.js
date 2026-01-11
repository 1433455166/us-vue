// src/router/guards.js
import { createApp, h } from 'vue';
import Cookies from 'js-cookie';
import PasswordGuard from '../components/PasswordGuard.vue';
import { accessPassword } from '../common/const';

export const passwordGuard = (to, from, next) => {
//   console.log('Password guard triggered for', to.path); // 调试信息
    // 检查 cookie
    const storedPassword = Cookies.get('accessPassword');
    if (storedPassword && storedPassword === accessPassword) {
        next();
        return;
    }

  // 创建一个 Vue 应用实例
  const app = createApp({
    setup() {
      const onSuccess = () => {
        console.log('Password is correct, continuing to', to.path); // 调试信息

        // 清理
        const modalElement = document.getElementById('password-guard-modal');
        if (modalElement) {
          app.unmount();
          document.body.removeChild(modalElement);
        }

        next();
      };

      return () => h(PasswordGuard, { onSuccess });
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

  // 检查 modal 内容
//   setTimeout(() => {
//     console.log('Modal content after mount:', modal.innerHTML);
//   }, 1000);
};
