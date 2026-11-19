<template>
  <div class="game-wrapper">
    <BackButton class="game-back" />
    <div class="game-container">
      <!-- 开始界面 -->
      <gomoku-start
        v-if="showStart"
        v-model:mode="mode"
        v-model:join-code="joinCode"
        :online-stage="onlineStage"
        :online-tip="onlineTip"
        :room-code="roomCode"
        :rooms="visibleRooms"
        @start="startGame"
        @create-room="online.createRoom"
        @join-room="online.joinRoom"
        @pick-room="pickRoom"
        @leave-room="backToStart"
        @copy-link="copyLink"
      />

      <!-- 游戏主界面 -->
      <div v-else class="game-main">
        <div class="top-bar">
          <div class="status" :class="statusTone">
            <span class="status-dot"></span>
            <span class="status-text">{{ statusText }}</span>
          </div>
          <div class="top-actions">
            <gomoku-spectators v-if="mode === 'online'" :items="spectators" />
            <button
              v-if="role !== 'spectator' && mode === 'online' && onlineStage === 'playing'"
              class="icon-btn voice-btn"
              :class="{
                calling: voiceState === 'calling',
                connected: voiceState === 'connected',
              }"
              :title="voiceTitle"
              :aria-label="voiceTitle"
              @click="toggleVoice"
            >{{ voiceIcon }}</button>
            <button
              v-if="role !== 'spectator'"
              class="icon-btn undo-btn"
              title="悔棋"
              aria-label="悔棋"
              :disabled="!canUndo"
              @click="undoMove"
            >↩️</button>
            <button
              class="icon-btn reset-btn"
              title="返回主页"
              aria-label="返回主页"
              @click="backToStart"
            >🏠</button>
          </div>
        </div>

        <gomoku-board
          :cells="cells"
          :last-move="lastMove"
          :win-cells="winCells"
          @pick="placeStone"
        />

        <div class="tip-bar">{{ tipText }}</div>

        <!-- 弹幕（联机对局中可用；语音播报仅限两位对局玩家，观众静音） -->
        <gomoku-danmaku
          v-if="mode === 'online' && onlineStage === 'playing'"
          :items="danmakuList"
          :voice-enabled="role !== 'spectator'"
          @send="handleDanmakuSend"
        />

        <!-- 对局结束弹窗（延迟 1s 出现，先看清棋盘上的连线） -->
        <gomoku-over-modal
          v-if="showOverModal"
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

        <!-- 对方语音通话邀请弹窗 -->
        <gomoku-confirm-modal
          v-if="showVoiceConfirm"
          title="语音通话邀请"
          text="对方邀请你进行实时语音通话，是否接听？"
          confirm-text="📞 接听"
          cancel-text="❌ 拒绝"
          @confirm="acceptVoice"
          @cancel="rejectVoice"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import BackButton from '../../../components/BackButton.vue'
import GomokuStart from './components/GomokuStart.vue'
import GomokuBoard from './components/GomokuBoard.vue'
import GomokuOverModal from './components/GomokuOverModal.vue'
import GomokuConfirmModal from './components/GomokuConfirmModal.vue'
import GomokuDanmaku from './components/GomokuDanmaku.vue'
import GomokuSpectators from './components/GomokuSpectators.vue'
import { useGomokuBoard } from './utils/useGomokuBoard'
import { useOnlineGame } from './utils/useOnlineGame'
import { useGomokuAI } from './utils/useGomokuAI'
import { useGomokuVoice } from './utils/useGomokuVoice'
import { useGomokuDanmaku } from './utils/useGomokuDanmaku'
import { useGomokuTexts } from './utils/useGomokuTexts'
import { useGomokuRemote } from './utils/useGomokuRemote'
import { useGomokuLobby } from './utils/useGomokuLobby'
import { useGomokuActions } from './utils/useGomokuActions'
import { copyInviteLink } from './utils/copyInviteLink'
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

/* ---------- 本地状态 ---------- */
const showStart = ref(true)
const mode = ref('ai') // pvp 双人 / ai 人机 / online 联机
const showLeaveConfirm = ref(false)
// 联机悔棋：undoPending 我方等待对方确认 / showUndoConfirm 对方请求待确认
const undoPending = ref(false)
const showUndoConfirm = ref(false)
const undoRequestColor = ref(0)
const undoTimer = ref(null)
const notice = ref('')
// 观众视角：房间对局是否已开始（sync 下发时标记）
const roomStarted = ref(true)
let overModalTimer = null

/* ---------- 人机 AI ---------- */
const { aiThinking, aiMove, clearAiTimer } = useGomokuAI({
  board,
  history,
  doMove,
  checkEnd
})

/* ---------- 联机对战 ---------- */
const online = useOnlineGame({
  onStart: () => {
    initBoard()
    showStart.value = false
  },
  // 房主下发棋局：以观众身份进入，回放当前棋谱
  onSync: (msg) => handleSync(msg),
  // 断线重连后的棋局补齐：保持原角色
  onResync: (msg) => handleResync(msg),
  // 房主下发 sync 时提供当前棋谱（同步用于围观）
  getHistory: () =>
    history.value.map((m) => ({ row: m.row, col: m.col })),
  onRemoteMove: (msg) => applyRemoteMove(msg),
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
  // 对方语音信令（SDP/ICE 等），交给语音模块处理
  onVoiceSignal: (msg) => handleVoiceSignal(msg),
  onRestart: () => initBoard(),
  // 对方/房主离开：关闭连接并回到主页，避免残留对局状态导致无法重新加入
  onLeave: () => {
    const wasSpectator = role.value === 'spectator'
    online.closeWs()
    role.value = 'player'
    onlineStage.value = 'idle'
    showStart.value = true
    onlineTip.value = wasSpectator ? '房主已离开，房间已关闭' : '对方已离开，房间已关闭'
  }
})
const { onlineStage, onlineTip, roomCode, joinCode, myColor } = online
const { role, spectators } = online

/* ---------- 语音通话 ---------- */
const {
  voiceState,
  voiceIcon,
  voiceTitle,
  showVoiceConfirm,
  toggleVoice,
  acceptVoice,
  rejectVoice,
  hangUp,
  handleSignal: handleVoiceSignal
} = useGomokuVoice({ online, setNotice: (tip) => (notice.value = tip) })

/* ---------- 远端落子与棋局回放 ---------- */
const { applyRemoteMove, replayHistory } = useGomokuRemote({
  board,
  history,
  lastMove,
  turn,
  gameOver,
  checkEnd,
  undoPending,
  undoTimer,
  notice,
  onlineStage
})

/* ---------- 弹幕 ---------- */
const { danmakuList, addDanmaku, handleDanmakuSend } = useGomokuDanmaku({
  mode,
  onlineStage,
  sendChat: online.sendChat
})

/* ---------- 界面文案与状态 ---------- */
const { cells, tipText, statusText, statusTone, winnerText, canUndo } =
  useGomokuTexts({
    board,
    mode,
    role,
    roomCode,
    myColor,
    gameOver,
    winner,
    turn,
    onlineStage,
    undoPending,
    roomStarted,
    history,
    aiThinking,
    notice
  })

// 对局结束后延迟 1s 再弹结果，先让玩家看清棋盘上的五连
const showOverModal = ref(false)
watch(gameOver, (val) => {
  clearTimeout(overModalTimer)
  if (val) {
    overModalTimer = setTimeout(() => (showOverModal.value = true), 1000)
  } else {
    showOverModal.value = false
  }
})

/* ---------- 围观与房间列表 ---------- */
const { handleSync, handleResync, pickRoom, visibleRooms } = useGomokuLobby({
  online,
  mode,
  showStart,
  role,
  roomCode,
  joinCode,
  onlineStage,
  roomStarted,
  notice,
  initBoard,
  replayHistory
})

initBoard()

// 通过邀请链接打开（#/game/gomoku?room=xxxx）时自动加入房间
const room = route.query.room
if (room) {
  mode.value = 'online'
  joinCode.value = String(room)
  online.joinRoom()
}

// 切后台：暂停围观心跳并通知名单移除；回前台恢复（连接断开则走自动重连）
function handlePageHide() {
  online.pauseWatch()
}
function handlePageShow() {
  online.resumeWatch()
}
window.addEventListener('pagehide', handlePageHide)
window.addEventListener('pageshow', handlePageShow)

onBeforeUnmount(() => {
  clearAiTimer()
  clearTimeout(undoTimer.value)
  clearTimeout(overModalTimer)
  window.removeEventListener('pagehide', handlePageHide)
  window.removeEventListener('pageshow', handlePageShow)
  online.leaveWatch()
  online.leaveLobby()
  online.closeWs()
  stopSpeak()
})

/* ---------- 对局操作 ---------- */
const {
  startGame,
  backToStart,
  doLeaveRoom,
  resetGame,
  placeStone,
  undoMove,
  acceptUndo,
  rejectUndo
} = useGomokuActions({
  online,
  mode,
  showStart,
  role,
  onlineStage,
  onlineTip,
  board,
  history,
  turn,
  gameOver,
  notice,
  undoPending,
  undoTimer,
  showLeaveConfirm,
  showUndoConfirm,
  undoRequestColor,
  showVoiceConfirm,
  roomStarted,
  canUndo,
  aiThinking,
  myColor,
  initBoard,
  doMove,
  checkEnd,
  undo,
  undoOfColor,
  aiMove,
  clearAiTimer,
  hangUp
})

/* ---------- 邀请链接复制 ---------- */
function copyLink() {
  copyInviteLink(
    `${location.origin}${location.pathname}#/game/gomoku?room=${roomCode.value}`,
    (tip) => (onlineTip.value = tip)
  )
}
</script>

<style scoped src="./index.css"></style>
