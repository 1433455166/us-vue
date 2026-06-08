<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>即时聊天室</h2>
      <div :class="['status', connected ? 'online' : 'offline']">
        {{ connected ? '已连接' : '未连接' }}
      </div>
    </div>
    
    <div class="chat-messages">
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="['message', msg.type]"
      >
        {{ msg.content }}
      </div>
    </div>
    
    <div class="chat-input">
      <input 
        v-model="inputMessage" 
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        :disabled="!connected"
      />
      <button @click="sendMessage" :disabled="!connected || !inputMessage.trim()">
        发送
      </button>
    </div>
  </div>
</template>

<script>
import { ADDRESS } from '../common/enum.ts';

export default {
  name: 'Chat',
  data() {
    return {
      messages: [],
      inputMessage: '',
      connected: false,
      ws: null
    }
  },
  mounted() {
    this.connect()
    window.addEventListener('beforeunload', this.disconnect)
  },
  beforeUnmount() {
    this.disconnect()
    window.removeEventListener('beforeunload', this.disconnect)
  },
  methods: {
    connect() {
      // 连接到Java后端WebSocket服务
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${ADDRESS}/chat`
      
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        this.connected = true
        this.addMessage('system', '【系统】已成功连接到聊天室')
      }
      
      this.ws.onmessage = (event) => {
        const content = event.data
        if (content.includes('【系统】')) {
          this.addMessage('system', content)
        } else {
          this.addMessage('other', content)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.addMessage('system', '【系统】连接出现错误')
      }
      
      this.ws.onclose = () => {
        this.connected = false
        this.addMessage('system', '【系统】连接已断开')
      }
    },
    
    disconnect() {
      if (this.ws) {
        this.ws.close()
      }
    },
    
    sendMessage() {
      if (!this.inputMessage.trim() || !this.connected) return
      this.ws.send(this.inputMessage)
      this.inputMessage = ''
    },
    
    addMessage(type, content) {
      this.messages.push({ type, content })
      this.$nextTick(() => {
        const chatMessages = this.$el.querySelector('.chat-messages')
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight
        }
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  width: 100%;
  /* max-width: 500px; */
  margin: 0 auto;
  background: white;
  /* border-radius: 16px; */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.chat-header h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.status {
  font-size: 12px;
}

.status.online {
  color: #a8e6cf;
}

.status.offline {
  color: #ff8b8b;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.message {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 20px;
  margin-bottom: 12px;
  word-wrap: break-word;
}

.message.system {
  align-self: center;
  background: #e0e0e0;
  color: #666;
  font-size: 12px;
}

.message.other {
  align-self: flex-start;
  background: white;
  border: 1px solid #e0e0e0;
  color: #333;
}

.message.self {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-input {
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
}

.chat-input input:focus {
  border-color: #667eea;
}

.chat-input button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>