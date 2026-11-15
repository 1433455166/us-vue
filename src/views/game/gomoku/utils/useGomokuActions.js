import { EMPTY, BLACK, WHITE } from './gomoku.constants'

// 悔棋请求防抖间隔（毫秒）
const UNDO_REQUEST_COOLDOWN = 3000

// 对局操作：开局/离开/重开/落子/悔棋（本地与联机确认流程）
export function useGomokuActions({
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
}) {
  // 上次发出悔棋请求的时间（3s 防抖）
  let lastUndoRequestAt = 0

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
    clearAiTimer()
    showLeaveConfirm.value = false
    showVoiceConfirm.value = false
    if (mode.value === 'online') {
      hangUp() // 离开前挂断语音（未通话时为空操作）
      // 先记住身份：leaveWatch 会把观众重置为 player，影响下面的判断
      const wasSpectator = role.value === 'spectator'
      online.leaveWatch() // 观众离开：即时通知房间更新围观名单
      // 只有对局者离开才通知房主；观众离开绝不能触发"对方已离开"关房逻辑
      if (!wasSpectator && onlineStage.value === 'playing') {
        online.sendLeave()
      }
      online.closeRoom() // 房主离开时向大堂下架房间
    }
    online.closeWs()
    role.value = 'player'
    roomStarted.value = true
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
    if (role.value === 'spectator') return // 观众只围观不可落子
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
      // 3s 防抖：被拒绝/超时后不能立刻连续悔棋
      const now = Date.now()
      if (now - lastUndoRequestAt < UNDO_REQUEST_COOLDOWN) {
        notice.value = '悔棋请求发送太频繁，请稍候再试'
        return
      }
      lastUndoRequestAt = now
      // 联机悔棋：发送请求，等待对方确认后才生效
      online.sendUndoRequest()
      undoPending.value = true
      notice.value = ''
      clearTimeout(undoTimer.value)
      undoTimer.value = setTimeout(() => {
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

  return {
    startGame,
    backToStart,
    doLeaveRoom,
    resetGame,
    placeStone,
    undoMove,
    acceptUndo,
    rejectUndo
  }
}
