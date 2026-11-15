import { createApp } from 'vue';
import Cookies from 'js-cookie';
import './style.css';
import App from './App.vue';
import router from "./router";
import ModalManager from './components/Modal/ModalManager.vue'

// 本地启动（npm run start）时，在 cookie 中存 env=true
if (import.meta.env.DEV) {
  Cookies.set('env', 'true');
}

// 全局样式
import './assets/css/global.css';

const app = createApp(App);

// 全局注册
app.component('AdvancedModal', () => import('./components/Modal/AdvancedModal.vue'));

// 挂载 ModalManager
const modalManager = createApp(ModalManager);
const modalContainer = document.createElement('div');
modalContainer.id = 'modal-container';
document.body.appendChild(modalContainer);
modalManager.mount(modalContainer);

app.use(router).mount('#app');
