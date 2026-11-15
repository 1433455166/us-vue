import { computed } from 'vue'
import { SIZE, BLACK, WHITE } from './gomoku.constants'

// 界面展示相关的计算属性：棋盘单元格、提示/状态/结果文案、悔棋可用性
export function useGomokuTexts({
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
}) {
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
      if (role.value === 'spectator') {
        return `房间 ${roomCode.value} · 围观模式，可在下方发弹幕`
      }
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
      if (role.value === 'spectator') {
        return roomStarted.value ? '👀 围观中' : '等待玩家加入…'
      }
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

  // 状态胶囊的颜色：结束后高亮，等待/思考中呼吸，轮到己方常亮
  const statusTone = computed(() => {
    if (gameOver.value) return 'win'
    if (mode.value === 'online') {
      if (role.value === 'spectator') {
        return roomStarted.value ? 'turn' : 'wait'
      }
      if (onlineStage.value !== 'playing') return 'wait'
      return turn.value === myColor.value ? 'turn' : 'wait'
    }
    if (mode.value === 'ai') return turn.value === BLACK ? 'turn' : 'wait'
    return 'turn'
  })

  const winnerText = computed(() => {
    if (role.value === 'spectator') {
      return winner.value === BLACK
        ? '🏆 黑方五子连线，取得胜利！'
        : '🏆 白方五子连线，取得胜利！'
    }
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
    if (role.value === 'spectator') return false // 观众不可操作棋局
    if (mode.value === 'online') {
      // 联机悔棋：只能悔自己刚落的那一手——
      // 最后一手是自己（seq 偶数为黑、奇数为白）且未在等待确认时才能悔；
      // 对手落子后最后一手归对手，只有对手可以悔
      const lastIsMine =
        ((history.value.length - 1) % 2 === 0 ? BLACK : WHITE) ===
        myColor.value
      return (
        onlineStage.value === 'playing' &&
        !undoPending.value &&
        lastIsMine
      )
    }
    if (mode.value === 'ai') {
      // 人机模式：AI 思考中不允许悔棋
      return !aiThinking.value
    }
    return true
  })

  return { cells, tipText, statusText, statusTone, winnerText, canUndo }
}
