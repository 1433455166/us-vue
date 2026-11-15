<template>
  <div class="start-stage">
    <div class="start-box">
      <div class="main-word">⚫ 五子棋对决</div>
      <div class="sub-word">黑白轮流落子，五子连线即胜</div>
      <div class="mode-select">
        <div
          v-for="item in modeItems"
          :key="item.value"
          class="mode-item"
          :class="{ active: mode === item.value }"
          @click="$emit('update:mode', item.value)"
        >{{ item.label }}</div>
      </div>

      <!-- 联机房间面板 -->
      <div v-if="mode === 'online'" class="online-panel">
        <button class="online-btn create" @click="$emit('create-room')">🎲 创建测试房间</button>
        <div class="join-row">
          <input
            :value="joinCode"
            class="join-input"
            maxlength="4"
            placeholder="房间号"
            inputmode="numeric"
            @input="$emit('update:joinCode', $event.target.value)"
          />
          <button class="online-btn join" @click="$emit('join-room')">加入房间</button>
        </div>
        <div v-if="onlineTip" class="online-tip">{{ onlineTip }}</div>
        <div v-if="onlineStage === 'waiting'" class="online-wait">
          <div>房间号：<b class="room-code">{{ roomCode }}</b></div>
          <button class="copy-btn" @click="$emit('copy-link')">📋 点击复制邀请链接</button>
        </div>
      </div>
      <button v-else class="start-btn" @click="$emit('start')">🚀 开始游戏</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GomokuStart',
  props: {
    mode: { type: String, required: true },
    onlineStage: { type: String, default: 'idle' },
    onlineTip: { type: String, default: '' },
    roomCode: { type: String, default: '' },
    joinCode: { type: String, default: '' }
  },
  emits: ['update:mode', 'update:joinCode', 'start', 'create-room', 'join-room', 'copy-link'],
  data() {
    return {
      modeItems: [
        { value: 'pvp', label: '👥 双人对战' },
        { value: 'ai', label: '🤖 人机对战' },
        { value: 'online', label: '🌐 联机对战' }
      ]
    }
  }
}
</script>

<style scoped>
.start-stage {
  padding: 40px 20px;
  text-align: center;
  background: #f9e7c2;
}
.start-box {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}
.main-word {
  font-size: 32px;
  font-weight: bold;
  color: #d64045;
}
.sub-word {
  font-size: 18px;
  color: #2c5a2e;
}
.mode-select {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 6px;
}
.mode-item {
  padding: 12px 18px;
  border-radius: 15px;
  border: 3px solid transparent;
  background: #fff;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.15s;
}
.mode-item.active {
  border-color: #d64045;
  background: #ffe3e0;
  color: #d64045;
  transform: scale(1.05);
}
.start-btn {
  margin-top: 10px;
  padding: 14px 40px;
  font-size: 22px;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #ff9f1c, #d64045);
  color: white;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(214, 64, 69, 0.4);
  transition: transform 0.15s;
}
.start-btn:hover {
  transform: scale(1.05);
}
.start-btn:active {
  transform: scale(0.95);
}

/* ---------- 联机房间面板 ---------- */
.online-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
  margin-top: 4px;
}
.online-btn {
  padding: 12px 24px;
  font-size: 17px;
  font-weight: bold;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.15s;
}
.online-btn:active {
  transform: scale(0.95);
}
.online-btn.create {
  background: linear-gradient(135deg, #ff9f1c, #d64045);
  color: white;
  box-shadow: 0 6px 16px rgba(214, 64, 69, 0.4);
}
.join-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.join-input {
  width: 110px;
  padding: 10px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 4px;
  border: 3px solid #ffb347;
  border-radius: 15px;
  outline: none;
}
.online-btn.join {
  background: #2a5f6e;
  color: white;
}
.online-tip {
  font-size: 13px;
  color: #2c5a2e;
  background: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  word-break: break-all;
  text-align: center;
}
.online-wait {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  font-size: 16px;
  color: #52412b;
  background: #fff;
  padding: 12px 16px;
  border-radius: 15px;
}
.room-code {
  font-size: 22px;
  color: #d64045;
  letter-spacing: 4px;
}
.copy-btn {
  padding: 8px 14px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  background: #60a5fa;
  color: white;
  cursor: pointer;
}
</style>
