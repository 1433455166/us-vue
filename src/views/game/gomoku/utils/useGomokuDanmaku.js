import { ref } from 'vue'

// 弹幕队列：本地飞行动画 + 联机转发
export function useGomokuDanmaku({ mode, onlineStage, sendChat }) {
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
      sendChat(text, voice)
    }
  }

  return { danmakuList, addDanmaku, handleDanmakuSend }
}
