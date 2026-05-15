/**
 * 简单的消息提示工具
 * 支持显示成功、错误、警告等类型的消息
 */

const DURATION = 3000;

// 默认配置
const defaultOptions = {
  duration: DURATION, // 自动关闭时间（毫秒）
  type: 'info',   // 消息类型：success, error, warning, info
  position: 'top-center' // 显示位置：top-center, top-right, bottom-center, bottom-right
};

// 样式映射
const typeStyles = {
  success: {
    background: '#f0f9eb',
    border: '1px solid #e1f3d8',
    color: '#67c23a'
  },
  error: {
    background: '#ff7e7e',
    border: '1px solid #FF0000',
    color: '#fff'
  },
  warning: {
    background: '#fdf6ec',
    border: '1px solid #faecd8',
    color: '#e6a23c'
  },
  info: {
    background: '#f4f4f5',
    border: '1px solid #e9e9eb',
    color: '#909399'
  }
};

// 创建消息容器
let messageContainer = null;
function createMessageContainer() {
  if (messageContainer) return messageContainer;
  
  messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    position: fixed;
    top: 64%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999999;
    pointer-events: none;
  `;
  document.body.appendChild(messageContainer);
  return messageContainer;
}

// 显示消息
function showMessage(message, options = {}) {
  const config = { ...defaultOptions, ...options };
  const container = createMessageContainer();
  
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    min-width: 81vw;
    word-break: break-word;
    pointer-events: auto;
    ${Object.entries(typeStyles[config.type] || typeStyles.info)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')}
  `;
  
  container.appendChild(messageElement);
  
  // 自动移除
  setTimeout(() => {
    messageElement.style.opacity = '0';
    messageElement.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, DURATION);
  }, config.duration);
  
  return messageElement;
}

// 导出不同类型的快捷方法
export const message = {
  success(msg, duration = DURATION) {
    return showMessage(msg, { type: 'success', duration });
  },
  error(msg, duration = DURATION) {
    return showMessage(msg, { type: 'error', duration });
  },
  warning(msg, duration = DURATION) {
    return showMessage(msg, { type: 'warning', duration });
  },
  info(msg, duration = DURATION) {
    return showMessage(msg, { type: 'info', duration });
  }
};

export default message;