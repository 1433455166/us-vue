<template>
  <div class="game-wrapper">
    <div class="game-container">
      <!-- 开始界面 -->
      <gomoku-start
        v-if="showStart"
        v-model:mode="mode"
        v-model:join-code="joinCode"
        :online-stage="onlineStage"
        :online-tip="onlineTip"
        :room-code="roomCode"
        @start="startGame"
        @create-room="online.createRoom"
        @join-room="online.joinRoom"
        @copy-link="copyLink"
      />

      <!-- 游戏主界面 -->
      <div v-else class="game-main">
        <div class="top-bar">
          <div class="status" :class="{ win: gameOver }">{{ statusText }}</div>
          <div class="top-actions">
            <!-- 语音通话暂不上线，注释入口保留代码
            <button
              v-if="mode === 'online' && onlineStage === 'playing'"
              class="voice-btn"
              :class="{ active: voiceState === 'connected' }"
              @click="toggleVoice"
            >
              {{ voiceState === 'connected' ? '🔊 挂断' : voiceState === 'calling' ? '📞 接通中' : '🎙️ 语音' }}
            </button>
            -->
            <button class="undo-btn" @click="undoMove" :disabled="!canUndo">↩️ 悔棋</button>
            <button class="reset-btn" @click="backToStart">🏠 主页</button>
          </div>
        </div>

        <gomoku-board
          :cells="cells"
          :last-move="lastMove"
          :win-cells="winCells"
          @pick="placeStone"
        />

        <div class="tip-bar">{{ tipText }}</div>

        <!-- 弹幕（联机对局中可用） -->
        <gomoku-danmaku
          v-if="mode === 'online' && onlineStage === 'playing'"
          :items="danmakuList"
          @send="handleDanmakuSend"
        />

        <!-- 对局结束弹窗 -->
        <gomoku-over-modal
          v-if="gameOver"
          :winner-text="winnerText"
          @restart="resetGame"
          @home="backToStart"
        />

        <!-- 联机离开确认弹窗 -->
        <gomoku-confirm-modal
          v-if="showLeaveConfirm"
          title="确认离开对局？"
          text="离开后将关闭本房间并通知对方，对方会自动返回主页。"
          confirm-text="✅ 确认离开"
          cancel-text="↩️ 继续对局"
          @confirm="doLeaveRoom"
          @cancel="showLeaveConfirm = false"
        />

        <!-- 对方悔棋请求确认弹窗 -->
        <gomoku-confirm-modal
          v-if="showUndoConfirm"
          title="对方请求悔棋"
          text="对方想撤销自己的一步棋，是否同意？"
          confirm-text="✅ 同意悔棋"
          cancel-text="❌ 拒绝"
          @confirm="acceptUndo"
          @cancel="rejectUndo"
        />

        <!-- 语音通话暂不上线，注释入口保留代码
        <gomoku-confirm-modal
          v-if="showVoiceConfirm"
          title="语音通话邀请"
          text="对方邀请你进行实时语音通话，是否接听？"
          confirm-text="📞 接听"
          cancel-text="❌ 拒绝"
          @confirm="acceptVoice"
          @cancel="rejectVoice"
        />
        -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import GomokuStart from './components/GomokuStart.vue'
import GomokuBoard from './components/GomokuBoard.vue'
import GomokuOverModal from './components/GomokuOverModal.vue'
import GomokuConfirmModal from './components/GomokuConfirmModal.vue'
import GomokuDanmaku from './components/GomokuDanmaku.vue'
import { SIZE, EMPTY, BLACK, WHITE } from './utils/gomoku.constants'
import { useGomokuBoard } from './utils/useGomokuBoard'
import { findBestMove } from './utils/gomokuAI'
import { useOnlineGame } from './utils/useOnlineGame'
import { useVoiceChat } from './utils/useVoiceChat'
import { speak, stopSpeak } from './utils/speech'

const route = useRoute()

/* ---------- 棋盘状态与规则 ---------- */
const {
  board,
  history,
  turn,
  gameOver,
  winner,
  lastMove,
  winCells,
  initBoard,
  doMove,
  checkEnd,
  undo,
  undoOfColor
} = useGomokuBoard()

/* ---------- 联机对战 ---------- */
const online = useOnlineGame({
  onStart: () => {
    initBoard()
    showStart.value = false
  },
  onRemoteMove: applyRemoteMove,
  // 对方请求悔棋：弹出确认框，由本方决定是否同意
  onRequestUndo: (color) => {
    undoRequestColor.value = color
    showUndoConfirm.value = true
  },
  // 对方同意了我方的悔棋请求：按我方颜色回放撤销
  onUndoAccept: (color) => {
    undoPending.value = false
    undoOfColor(color)
    notice.value = '对方同意悔棋，请重新落子'
  },
  // 对方拒绝了悔棋请求
  onUndoReject: () => {
    undoPending.value = false
    notice.value = '对方拒绝了悔棋请求'
  },
  // 对方弹幕：快捷语（voice 标记）在对方设备同样播报语音
  onChat: (text, voice) => {
    addDanmaku(text, false)
    if (voice) speak(text)
  },
  onRestart: () => initBoard(),
  // 对方离开：关闭连接并回到主页，避免残留对局状态导致无法重新加入
  onLeave: () => {
    online.closeWs()
    onlineStage.value = 'idle'
    showStart.value = true
    onlineTip.value = '对方已离开，房间已关闭'
  }
})
const { onlineStage, onlineTip, roomCode, joinCode, myColor } = online

/* ---------- 语音通话 ---------- */
const voice = useVoiceChat((action, extra) => online.sendSignal(action, extra), {
  onError: (tip) => (notice.value = tip),
  onIncomingCall: (sdp) => {
    incomingOffer.value = sdp
    showVoiceConfirm.value = true
  }
})
const { voiceState } = voice
const showVoiceConfirm = ref(false)
const incomingOffer = ref(null)

/* ---------- 本地状态 ---------- */
const showStart = ref(true)
const mode = ref('ai') // pvp 双人 / ai 人机 / online 联机
const aiThinking = ref(false)
const showLeaveConfirm = ref(false)
// 联机悔棋：undoPending 我方等待对方确认 / showUndoConfirm 对方请求待确认
const undoPending = ref(false)
const showUndoConfirm = ref(false)
const undoRequestColor = ref(0)
const notice = ref('')
let aiTimer = null
let undoTimer = null

/* ---------- 弹幕 ---------- */
const danmakuList = ref([])
let danmakuId = 0
function addDanmaku(text, self) {
  const id = ++danmakuId
  danmakuList.value.push({
    id,
    text,
    self,
    top: 40 + Math.random() * 220
  })
  // 动画结束后自动清理（动画时长 9s）
  setTimeout(() => {
    danmakuList.value = danmakuList.value.filter((d) => d.id !== id)
  }, 9200)
}
function handleDanmakuSend({ text, voice }) {
  addDanmaku(text, true)
  if (mode.value === 'online' && onlineStage.value === 'playing') {
    online.sendChat(text, voice)
  }
}

initBoard()

// 通过邀请链接打开（#/game/gomoku?room=xxxx）时自动加入房间
const room = route.query.room
if (room) {
  mode.value = 'online'
  joinCode.value = String(room)
  online.joinRoom()
}

onBeforeUnmount(() => {
  clearTimeout(aiTimer)
  clearTimeout(undoTimer)
  online.closeWs()
  stopSpeak()
})

/* ---------- 计算属性 ---------- */
const cells = computed(() => {
  const list = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      list.push({
        index: row * SIZE + col,
        row,
        col,
        value: board.value[row][col]
      })
    }
  }
  return list
})

const tipText = computed(() => {
  if (notice.value) return notice.value
  if (mode.value === 'online') {
    return `房间 ${roomCode.value} · 你执${
      myColor.value === BLACK ? '黑（先行）' : '白（后行）'
    }棋`
  }
  return mode.value === 'ai'
    ? '你执黑先行，AI 执白应战'
    : '黑方先行，点击棋盘落子'
})

const statusText = computed(() => {
  if (gameOver.value) {
    return winner.value === BLACK ? '⚫ 黑方获胜！' : '⚪ 白方获胜！'
  }
  if (mode.value === 'online') {
    if (onlineStage.value !== 'playing') return '等待对手加入…'
    if (undoPending.value) return '等待对方确认悔棋…'
    return turn.value === myColor.value
      ? `轮到你落子（${myColor.value === BLACK ? '黑棋' : '白棋'}）`
      : '等待对方落子…'
  }
  if (mode.value === 'ai') {
    return turn.value === BLACK ? '轮到你落子（黑棋）' : 'AI 思考中…'
  }
  return turn.value === BLACK ? '轮到黑方落子' : '轮到白方落子'
})

const winnerText = computed(() => {
  if (mode.value === 'online') {
    return winner.value === myColor.value
      ? '🏆 你赢了！五子连线！'
      : '😔 你输了，再接再厉！'
  }
  return winner.value === BLACK
    ? '🏆 黑方五子连线，取得胜利！'
    : '🏆 白方五子连线，取得胜利！'
})

const canUndo = computed(() => {
  if (gameOver.value || history.value.length === 0) return false
  if (mode.value === 'online') {
    // 联机模式：对局中且至少有一手棋时可悔棋
    return onlineStage.value === 'playing'
  }
  if (mode.value === 'ai') {
    // 人机模式：AI 思考中不允许悔棋
    return !aiThinking.value
  }
  return true
})

/* ---------- 对局操作 ---------- */
function startGame() {
  initBoard()
  showStart.value = false
}

function backToStart() {
  // 联机对局中离开：先弹确认框，确认后才关闭房间并通知对方
  if (mode.value === 'online' && onlineStage.value === 'playing') {
    showLeaveConfirm.value = true
    return
  }
  doLeaveRoom()
}

function doLeaveRoom() {
  clearTimeout(aiTimer)
  aiThinking.value = false
  showLeaveConfirm.value = false
  showVoiceConfirm.value = false
  if (mode.value === 'online') {
    voice.hangUp() // 离开前挂断语音（未通话时为空操作）
    if (onlineStage.value === 'playing') {
      online.sendLeave()
    }
  }
  online.closeWs()
  onlineStage.value = 'idle'
  onlineTip.value = ''
  showStart.value = true
}

function resetGame() {
  initBoard()
  if (mode.value === 'online') {
    online.sendRestart()
  }
}

function placeStone(cell) {
  const { row, col } = cell
  if (gameOver.value || aiThinking.value) return
  if (undoPending.value) return // 悔棋等待确认期间禁止落子
  if (board.value[row][col] !== EMPTY) return
  notice.value = ''
  if (mode.value === 'ai' && turn.value !== BLACK) return
  if (
    mode.value === 'online' &&
    (onlineStage.value !== 'playing' || turn.value !== myColor.value)
  ) {
    return
  }
  doMove(row, col)
  if (mode.value === 'online') {
    online.sendMove(row, col, history.value.length - 1)
  }
  if (checkEnd(row, col)) return
  if (mode.value === 'ai' && turn.value === WHITE) {
    aiMove()
  }
}

function undoMove() {
  if (!canUndo.value || history.value.length === 0) return
  if (mode.value === 'online') {
    // 联机悔棋：发送请求，等待对方确认后才生效
    online.sendUndoRequest()
    undoPending.value = true
    notice.value = ''
    clearTimeout(undoTimer)
    undoTimer = setTimeout(() => {
      if (undoPending.value) {
        undoPending.value = false
        notice.value = '对方未响应悔棋请求'
      }
    }, 10000)
    return
  }
  // 人机模式撤销后轮到玩家（黑棋），成对撤销
  undo(mode.value === 'ai' ? 2 : 1)
}

function acceptUndo() {
  const color = undoRequestColor.value
  showUndoConfirm.value = false
  online.sendUndoAccept(color)
  // 按请求方颜色回放撤销，之后轮到请求方行棋
  undoOfColor(color)
  notice.value = ''
}

function rejectUndo() {
  showUndoConfirm.value = false
  online.sendUndoReject()
}

/* ---------- 语音通话 ---------- */
function toggleVoice() {
  if (voiceState.value === 'idle') {
    voice.startCall()
  } else {
    voice.hangUp()
  }
}

function acceptVoice() {
  showVoiceConfirm.value = false
  const sdp = incomingOffer.value
  incomingOffer.value = null
  if (sdp) {
    voice.acceptCall(sdp)
  }
}

function rejectVoice() {
  showVoiceConfirm.value = false
  voice.rejectCall()
  incomingOffer.value = null
}

function aiMove() {
  aiThinking.value = true
  // 稍作延迟，模拟思考并让界面有机会渲染
  aiTimer = setTimeout(() => {
    const best = findBestMove(board.value, history.value)
    aiThinking.value = false
    if (best) {
      doMove(best.row, best.col)
      checkEnd(best.row, best.col)
    }
  }, 300)
}

// 对手落子：按步数序号 + 奇偶校验，防乱序/重复，保证双方棋盘一致
function applyRemoteMove(msg) {
  const { row, col, seq } = msg
  if (
    gameOver.value ||
    onlineStage.value !== 'playing' ||
    typeof row !== 'number' ||
    typeof col !== 'number' ||
    seq !== history.value.length
  ) {
    return
  }
  // 对方已继续落子，未处理的悔棋请求自动失效
  if (undoPending.value) {
    undoPending.value = false
    clearTimeout(undoTimer)
    notice.value = '对方已落子，悔棋请求已失效'
  }
  const player = seq % 2 === 0 ? BLACK : WHITE
  if (board.value[row][col] !== EMPTY) return
  board.value[row][col] = player
  history.value.push({ row, col, player })
  lastMove.value = { row, col }
  turn.value = player === BLACK ? WHITE : BLACK
  checkEnd(row, col)
}

/* ---------- 邀请链接复制 ---------- */
// 兼容 HTTP 环境（局域网 IP 访问）：clipboard API 不可用时回退到 execCommand
function copyLink() {
  const url = `${location.origin}${location.pathname}#/game/gomoku?room=${roomCode.value}`
  const fallbackShow = () => {
    onlineTip.value = `复制失败，请手动复制：${url}`
  }
  const legacyCopy = () => {
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      onlineTip.value = ok ? '链接已复制，发给好友即可加入' : ''
      if (!ok) fallbackShow()
    } catch (e) {
      fallbackShow()
    }
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(url)
      .then(() => (onlineTip.value = '链接已复制，发给好友即可加入'))
      .catch(legacyCopy)
  } else {
    legacyCopy()
  }
}
</script>

<style scoped>
.game-wrapper {
  min-height: 100vh;
  background: linear-gradient(145deg, #1a5f7a, #0e3b4a);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial, sans-serif;
  padding: 10px;
}

.game-container {
  width: 100%;
  max-width: 500px;
  background: #fff8e1;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.game-main {
  padding: 20px 15px 25px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
  z-index: 1001;
}
.status {
  background: #2a5f6e;
  color: #f9e0a0;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}
.status.win {
  background: #d64045;
  color: #fff;
}
.top-actions {
  display: flex;
  flex-shrink: 0;
}
.undo-btn,
.reset-btn {
  padding: 6px 10px;
  margin-left: 6px;
  border: none;
  border-radius: 15px;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.undo-btn {
  background: #60a5fa;
  color: white;
}
.voice-btn {
  padding: 6px 10px;
  margin-left: 6px;
  border: none;
  border-radius: 15px;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  background: #ff9f1c;
  color: white;
}
.voice-btn.active {
  background: #2c8a4b;
}
.voice-btn:active {
  transform: scale(0.95);
}
.reset-btn {
  background: #daa06a;
  color: white;
}
.undo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tip-bar {
  text-align: center;
  margin-top: 12px;
  padding: 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  background: #e6dcc8;
  color: #52412b;
}
</style>
