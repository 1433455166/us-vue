import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from "./router";
import ModalManager from './components/Modal/ModalManager.vue'

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
