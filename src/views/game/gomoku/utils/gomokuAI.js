import { SIZE, EMPTY, BLACK, WHITE, DIRECTIONS } from './gomoku.constants'

// AI 分值表：[连子数][封堵端数] -> 分数
const SCORE_TABLE = {
  1: { 0: 10, 1: 4, 2: 0 },
  2: { 0: 300, 1: 40, 2: 0 },
  3: { 0: 8000, 1: 500, 2: 0 },
  4: { 0: 300000, 1: 8000, 2: 0 },
  5: { 0: 10000000, 1: 10000000, 2: 10000000 }
}

// AI（执白）选择最佳落子点
export function findBestMove(board, history) {
  const aiPlayer = WHITE
  const humanPlayer = BLACK
  let bestScore = -1
  let best = null

  const candidates = getCandidateCells(board, history)
  for (const { row, col } of candidates) {
    const attack = evaluatePoint(board, row, col, aiPlayer)
    const defend = evaluatePoint(board, row, col, humanPlayer)
    let score = attack * 1.1 + defend
    // 稍微偏向中心
    const center = (SIZE - 1) / 2
    score += (SIZE - Math.abs(row - center) - Math.abs(col - center)) * 2
    if (score > bestScore) {
      bestScore = score
      best = { row, col }
    }
  }
  // 空盘时下在天元
  if (!best) {
    const c = Math.floor(SIZE / 2)
    best = { row: c, col: c }
  }
  return best
}

// 只考虑已有棋子周围的空位，缩小搜索范围
function getCandidateCells(board, history) {
  const set = []
  const seen = new Set()
  if (history.length === 0) {
    const c = Math.floor(SIZE / 2)
    return [{ row: c, col: c }]
  }
  for (const move of history) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = move.row + dr
        const c = move.col + dc
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue
        const key = r * SIZE + c
        if (board[r][c] === EMPTY && !seen.has(key)) {
          seen.add(key)
          set.push({ row: r, col: c })
        }
      }
    }
  }
  return set
}

// 评估：假设 player 在 (row,col) 落子后的进攻分值
function evaluatePoint(board, row, col, player) {
  let total = 0
  for (const [dx, dy] of DIRECTIONS) {
    let count = 1
    let block = 0
    // 正方向
    let i = 1
    while (true) {
      const r = row + dx * i
      const c = col + dy * i
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        block++
        break
      }
      const v = board[r][c]
      if (v === player) {
        count++
        i++
      } else {
        if (v !== EMPTY) block++
        break
      }
    }
    // 反方向
    i = 1
    while (true) {
      const r = row - dx * i
      const c = col - dy * i
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        block++
        break
      }
      const v = board[r][c]
      if (v === player) {
        count++
        i++
      } else {
        if (v !== EMPTY) block++
        break
      }
    }
    if (count >= 5) return SCORE_TABLE[5][0]
    total += SCORE_TABLE[Math.min(count, 4)][Math.min(block, 2)]
  }
  return total
}
