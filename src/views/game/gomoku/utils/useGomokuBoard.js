import { ref } from 'vue'
import { SIZE, EMPTY, BLACK, WHITE, DIRECTIONS } from './gomoku.constants'

// 棋盘状态与规则：落子、胜负判定、悔棋
export function useGomokuBoard() {
  const board = ref([])
  const history = ref([])
  const turn = ref(BLACK)
  const gameOver = ref(false)
  const winner = ref(0)
  const lastMove = ref(null)
  const winCells = ref([])

  function initBoard() {
    board.value = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => EMPTY)
    )
    history.value = []
    turn.value = BLACK
    gameOver.value = false
    winner.value = 0
    lastMove.value = null
    winCells.value = []
  }

  // 在 (row,col) 落子并切换行棋方
  function doMove(row, col) {
    board.value[row][col] = turn.value
    history.value.push({ row, col, player: turn.value })
    lastMove.value = { row, col }
    turn.value = turn.value === BLACK ? WHITE : BLACK
  }

  // 落子后检测五连；棋盘下满也结束（不展示平局弹窗，仅停止落子）
  function checkEnd(row, col) {
    const player = board.value[row][col]
    for (const [dx, dy] of DIRECTIONS) {
      const line = [{ row, col }]
      // 正方向
      for (let i = 1; i < 5; i++) {
        const r = row + dx * i
        const c = col + dy * i
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break
        if (board.value[r][c] !== player) break
        line.push({ row: r, col: c })
      }
      // 反方向
      for (let i = 1; i < 5; i++) {
        const r = row - dx * i
        const c = col - dy * i
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break
        if (board.value[r][c] !== player) break
        line.unshift({ row: r, col: c })
      }
      if (line.length >= 5) {
        gameOver.value = true
        winner.value = player
        winCells.value = line
        return true
      }
    }
    if (history.value.length === SIZE * SIZE) {
      gameOver.value = true
      winner.value = player
    }
    return gameOver.value
  }

  // 撤销 popCount 步（人机模式成对撤销，双人模式撤销 1 步）
  function undo(popCount) {
    for (let i = 0; i < popCount; i++) {
      const move = history.value.pop()
      if (!move) break
      board.value[move.row][move.col] = EMPTY
    }
    const last = history.value[history.value.length - 1]
    lastMove.value = last ? { row: last.row, col: last.col } : null
    winCells.value = []
    gameOver.value = false
    winner.value = 0
    turn.value = history.value.length % 2 === 0 ? BLACK : WHITE
  }

  // 联机悔棋：从后往前撤销，直到移除 color 方的最后一手，之后轮到 color 行棋。
  // 双方用同一规则各自回放，保证棋盘一致。
  function undoOfColor(color) {
    while (history.value.length > 0) {
      const move = history.value.pop()
      board.value[move.row][move.col] = EMPTY
      if (move.player === color) break
    }
    const last = history.value[history.value.length - 1]
    lastMove.value = last ? { row: last.row, col: last.col } : null
    winCells.value = []
    gameOver.value = false
    winner.value = 0
    turn.value = color
  }

  return {
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
  }
}
