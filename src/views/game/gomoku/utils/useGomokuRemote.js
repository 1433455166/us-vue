import { BLACK, WHITE, EMPTY } from './gomoku.constants'

// 联机对局的远端落子与棋局回放：
// - applyRemoteMove：按步数序号 + 奇偶校验，防乱序/重复，保证双方棋盘一致
// - replayHistory：按顺序回放全量棋谱（sync/resync 共用，seq 校验天然过滤重复包）
export function useGomokuRemote({
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
}) {
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
      clearTimeout(undoTimer.value)
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

  function replayHistory(msg) {
    const list = Array.isArray(msg.history) ? msg.history : []
    list.forEach((m, i) => {
      if (typeof m?.row === 'number' && typeof m?.col === 'number') {
        applyRemoteMove({ row: m.row, col: m.col, seq: i })
      }
    })
  }

  return { applyRemoteMove, replayHistory }
}
