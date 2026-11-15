<template>
  <div class="danmaku-root">
    <!-- 飞行弹幕层（覆盖全屏，不阻挡点击） -->
    <div class="danmaku-layer">
      <div
        v-for="item in items"
        :key="item.id"
        class="danmaku-item"
        :class="{ self: item.self }"
        :style="itemStyle(item)"
      >{{ item.text }}</div>
    </div>

    <!-- 弹幕输入区 -->
    <div class="danmaku-panel">
      <div class="input-row">
        <button class="emoji-btn" @click="showEmoji = !showEmoji">😀</button>
        <input
          v-model="text"
          class="danmaku-input"
          maxlength="30"
          placeholder="发送弹幕…"
          @keyup.enter="sendCustom"
        />
        <button class="send-btn" :disabled="cooldown" @click="sendCustom">发送</button>
      </div>

      <div v-if="showEmoji" class="emoji-panel">
        <button
          v-for="e in emojis"
          :key="e"
          class="emoji-item"
          :disabled="cooldown"
          @click="emitSend(e)"
        >{{ e }}</button>
      </div>

      <div class="quick-row">
        <button
          v-for="q in quickPhrases"
          :key="q"
          class="quick-chip"
          :disabled="cooldown"
          @click="sendQuick(q)"
        >{{ q }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { speak } from '../utils/speech'

// 淡色弹幕背景（按 id 轮换，保证同一条弹幕刷新时颜色稳定）
const PASTEL_COLORS = [
  '#FFE3E0', '#FFF3C4', '#E0F2E9', '#E3F0FF', '#F3E5F5',
  '#FFF0E0', '#E8F5E9', '#FCE4EC', '#E0F7FA', '#F9FBE7'
]

export default {
  name: 'GomokuDanmaku',
  props: {
    items: { type: Array, default: () => [] }
  },
  emits: ['send'],
  data() {
    return {
      text: '',
      showEmoji: false,
      cooldown: false, // 3 秒防抖，防止刷屏
      cooldownTimer: null,
      quickPhrases: [
        '快点吧，我等的花儿都谢了',
        '你好厉害！',
        '让我想想…',
        '这局稳了',
        '差点失误',
        '后悔了吧？',
        'GG，打得不错',
        '承让承让'
      ],
      emojis: [
        '😀', '😅', '😂', '😎', '🤔', '😱', '😭', '🙏',
        '👍', '👎', '💪', '🔥', '✨', '💢', '🎉', '⚫'
      ]
    }
  },
  methods: {
    itemStyle(item) {
      const style = {
        top: item.top + 'px',
        background: PASTEL_COLORS[item.id % PASTEL_COLORS.length]
      }
      return style
    },
    // 统一发送入口：3 秒防抖；voice 标记是否需要语音播报
    emitSend(text, voice = false) {
      if (this.cooldown) return
      this.$emit('send', { text, voice })
      this.cooldown = true
      clearTimeout(this.cooldownTimer)
      this.cooldownTimer = setTimeout(() => {
        this.cooldown = false
      }, 3000)
    },
    // 快捷语：发送弹幕的同时语音播报（点击即用户手势，满足浏览器播放条件）
    sendQuick(q) {
      speak(q)
      this.emitSend(q, true)
    },
    sendCustom() {
      const value = this.text.trim()
      if (!value) return
      this.emitSend(value)
      this.text = ''
      this.showEmoji = false
    }
  },
  beforeUnmount() {
    clearTimeout(this.cooldownTimer)
  }
}
</script>

<style scoped>
/* ---------- 飞行弹幕层 ---------- */
.danmaku-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  /* 高于 top-bar(1001)，低于弹窗(1100) */
  z-index: 1002;
}
.danmaku-item {
  position: absolute;
  left: 100%;
  white-space: nowrap;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: bold;
  color: #52412b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: danmaku-fly 9s linear forwards;
}
/* 自己发的弹幕文字加深区分 */
.danmaku-item.self {
  color: #d64045;
}
@keyframes danmaku-fly {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100vw - 100%));
  }
}

/* ---------- 弹幕输入区 ---------- */
.danmaku-panel {
  margin-top: 12px;
  background: #f9e7c2;
  border-radius: 20px;
  padding: 10px;
}
.input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.emoji-btn {
  width: 40px;
  height: 38px;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.emoji-btn:active {
  transform: scale(1.15);
}
.danmaku-input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  border: 2px solid #ffb347;
  border-radius: 12px;
  outline: none;
}
.send-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  background: #60a5fa;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
}

/* 表情面板 */
.emoji-panel {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  margin-top: 8px;
}
.emoji-item {
  font-size: 26px;
  line-height: 1.2;
  padding: 6px 0;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}
.emoji-item:hover {
  background: #ffe3e0;
}
.emoji-item:active {
  transform: scale(1.25);
}

/* 快捷语（位于输入框下方，隐藏滚动条） */
.quick-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-top: 8px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.quick-row::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
.quick-chip {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 13px;
  border: none;
  outline: none;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 15px;
  background: #fff;
  color: #52412b;
  cursor: pointer;
  transition: background 0.15s;
}
.quick-chip:hover {
  background: #ffe3e0;
}
.quick-chip:active {
  background: #ffd0cc;
}
/* 3 秒防抖期间的禁用态 */
.quick-chip:disabled,
.emoji-item:disabled,
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.danmaku-input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  border: 2px solid #ffb347;
  border-radius: 12px;
  outline: none;
}
.send-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  background: #60a5fa;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
