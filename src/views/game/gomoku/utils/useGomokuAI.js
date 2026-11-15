import { ref } from 'vue'
import { findBestMove } from './gomokuAI'

// 人机模式：白方 AI 延迟落子
export function useGomokuAI({ board, history, doMove, checkEnd }) {
  const aiThinking = ref(false)
  let aiTimer = null

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

  function clearAiTimer() {
    clearTimeout(aiTimer)
    aiThinking.value = false
  }

  return { aiThinking, aiMove, clearAiTimer }
}
