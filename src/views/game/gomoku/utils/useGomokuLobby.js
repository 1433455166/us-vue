import { computed, watch } from 'vue'

// 大堂与围观流程：
// - handleSync/handleResync：房主棋局同步（新观众进入 / 断线重连补齐）
// - pickRoom/visibleRooms/大堂连接：开局页实时房间列表
export function useGomokuLobby({
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
}) {
  // 收到房主棋局同步：转为观众并回放棋谱
  function handleSync(msg) {
    role.value = 'spectator'
    onlineStage.value = 'playing'
    roomStarted.value = msg.started !== false
    initBoard()
    showStart.value = false
    notice.value = ''
    replayHistory(msg)
  }

  // 断线重连后的棋局补齐：角色/棋盘状态都在内存里，只需重放全量棋谱
  function handleResync(msg) {
    notice.value = ''
    initBoard()
    replayHistory(msg)
  }

  // 大堂列表：等待中的房间加入对局，对局中的房间自动转为围观
  function pickRoom(code) {
    if (onlineStage.value === 'playing' || onlineStage.value === 'waiting') return
    joinCode.value = String(code)
    online.joinRoom()
  }

  // 等待对手时把自己的房间从列表里过滤掉（点了也不会有响应）
  const visibleRooms = computed(() =>
    online.rooms.value.filter(
      (r) => !(onlineStage.value === 'waiting' && r.code === roomCode.value)
    )
  )

  // 在线模式停留开局页时保持大堂连接，实时刷新房间列表
  watch(
    [mode, showStart],
    ([m, s]) => {
      if (m === 'online' && s) {
        online.enterLobby()
      } else {
        online.leaveLobby()
      }
    },
    { immediate: true }
  )

  return { handleSync, handleResync, pickRoom, visibleRooms }
}
