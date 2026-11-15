import { ref } from 'vue'
import { ADDRESS } from '../../../../common/enum.ts'
import { BLACK, WHITE } from './gomoku.constants'

// 联机对战：复用 Chat 页面的 WebSocket 广播通道（ADDRESS/chat），
// 通过 JSON 消息 + 房间号过滤实现双人联机，无需后端改动。
// 注意：Java 服务器广播时会加 "[会话id]: " 前缀，解析时需剥离。
export function useOnlineGame({
  onStart,
  onRemoteMove,
  onRequestUndo,
  onUndoAccept,
  onUndoReject,
  onChat,
  onVoiceSignal,
  onRestart,
  onLeave
}) {
  const ws = ref(null)
  const onlineStage = ref('idle') // idle 未开始 / waiting 等待对手 / playing 对局中
  const onlineTip = ref('')
  const roomCode = ref('')
  const joinCode = ref('')
  const myColor = ref(0)
  const clientId = 'gk-' + Math.random().toString(36).slice(2, 10)
  let joinTimer = null

  function createRoom() {
    roomCode.value = String(Math.floor(1000 + Math.random() * 9000))
    connectWs(() => {
      onlineStage.value = 'waiting'
      onlineTip.value = '房间已创建，请用另一台设备加入（点击下方按钮复制链接）'
    })
  }

  function joinRoom() {
    const code = joinCode.value.trim()
    if (!/^\d{4}$/.test(code)) {
      onlineTip.value = '请输入 4 位数字房间号'
      return
    }
    // 防止自己加入自己创建的房间（会导致双方永远等不到响应）
    if (onlineStage.value === 'waiting' && code === roomCode.value) {
      onlineTip.value = '当前设备就是该房间的房主，请用另一台设备加入'
      return
    }
    roomCode.value = code
    connectWs(() => {
      onlineTip.value = '正在加入房间，等待房主确认…'
      sendMsg('join')
      // 超时提示：房主可能未创建房间或页面已关闭
      clearTimeout(joinTimer)
      joinTimer = setTimeout(() => {
        if (onlineStage.value !== 'playing' && ws.value) {
          onlineTip.value = '加入超时：未收到房主响应，请确认房主已创建房间且页面保持打开'
        }
      }, 6000)
    })
  }

  function connectWs(onOpen) {
    closeWs()
    onlineTip.value = '正在连接服务器…'
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let wsUrl
    if (window.location.protocol === 'https:') {
      // HTTPS 页面受混合内容策略限制无法直连 ws:// 后端，
      // 改连当前域名下的 /chat（由 vite dev server 的 WebSocket 代理转发）
      wsUrl = `${protocol}//${window.location.host}/chat`
    } else {
      wsUrl = `${protocol}//${ADDRESS}/chat`
    }
    const socket = new WebSocket(wsUrl)
    ws.value = socket
    socket.onopen = () => {
      if (ws.value !== socket) return
      onOpen && onOpen()
    }
    socket.onmessage = (event) => handleGameMsg(event.data)
    socket.onerror = () => {
      if (ws.value !== socket) return
      onlineTip.value = `连接服务器失败（${ADDRESS}），请确认后端服务可用`
    }
    socket.onclose = () => {
      if (ws.value !== socket) return
      ws.value = null
      if (onlineStage.value === 'playing') {
        onlineTip.value = ''
      } else {
        onlineTip.value = '连接已断开'
      }
    }
  }

  function closeWs() {
    if (ws.value) {
      const socket = ws.value
      ws.value = null
      try {
        socket.onclose = null
        socket.close()
      } catch (e) {
        /* ignore */
      }
    }
    clearTimeout(joinTimer)
  }

  function sendMsg(action, extra) {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return
    ws.value.send(
      JSON.stringify({
        app: 'gomoku',
        room: roomCode.value,
        from: clientId,
        action,
        ...extra
      })
    )
  }

  function sendMove(row, col, seq) {
    sendMsg('move', { row, col, seq })
  }

  function sendUndoRequest() {
    // color 用于双方按同一规则回放悔棋，保证棋盘一致
    sendMsg('undo-request', { color: myColor.value })
  }

  function sendUndoAccept(color) {
    sendMsg('undo-accept', { color })
  }

  function sendUndoReject() {
    sendMsg('undo-reject')
  }

  function sendRestart() {
    sendMsg('restart')
  }

  function sendChat(text, voice = false) {
    if (typeof text !== 'string' || !text.trim()) return
    sendMsg('chat', { text: text.slice(0, 50), voice: !!voice })
  }

  // 语音信令透传（WebRTC SDP / ICE 候选等）
  function sendSignal(action, extra) {
    sendMsg(action, extra)
  }

  function sendLeave() {
    sendMsg('leave')
  }

  function beginOnlineGame(color) {
    clearTimeout(joinTimer)
    myColor.value = color
    onlineStage.value = 'playing'
    onlineTip.value = ''
    onStart(color)
  }

  function handleGameMsg(raw) {
    // 剥离服务器添加的 "[会话id]: " 前缀，提取其中的 JSON 部分
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
      return // 无 JSON 内容（普通聊天文本/系统消息），忽略
    }
    let msg
    try {
      msg = JSON.parse(raw.slice(start, end + 1))
    } catch (e) {
      return
    }
    if (!msg || msg.app !== 'gomoku' || msg.room !== roomCode.value) return
    if (msg.from === clientId) return // 过滤服务器回显给自己的消息

    switch (msg.action) {
      case 'join': // 我是房主，对手申请加入
        if (onlineStage.value !== 'waiting') return
        sendMsg('start')
        beginOnlineGame(BLACK)
        break
      case 'start': // 我是加入方，房主确认开局
        if (onlineStage.value !== 'playing') {
          beginOnlineGame(WHITE)
        }
        break
      case 'move':
        onRemoteMove(msg)
        break
      case 'undo-request': // 对方请求悔棋，等待本方确认
        if (
          onlineStage.value === 'playing' &&
          (msg.color === BLACK || msg.color === WHITE)
        ) {
          onRequestUndo(msg.color)
        }
        break
      case 'undo-accept': // 对方同意悔棋，按请求方颜色回放撤销
        if (msg.color === BLACK || msg.color === WHITE) {
          onUndoAccept(msg.color)
        }
        break
      case 'undo-reject': // 对方拒绝悔棋
        onUndoReject()
        break
      case 'chat': // 对方弹幕（voice=true 的快捷语需要播报语音）
        if (
          typeof msg.text === 'string' &&
          msg.text.trim() &&
          msg.text.length <= 50
        ) {
          onChat(msg.text, msg.voice === true)
        }
        break
      case 'voice-offer': // 语音信令统一透传
      case 'voice-answer':
      case 'voice-ice':
      case 'voice-reject':
      case 'voice-end':
        if (onlineStage.value === 'playing') {
          onVoiceSignal(msg)
        }
        break
      case 'restart':
        if (onlineStage.value === 'playing') {
          onRestart()
        }
        break
      case 'leave':
        if (onlineStage.value === 'playing') {
          onLeave()
        }
        break
      default:
        break
    }
  }

  return {
    ws,
    onlineStage,
    onlineTip,
    roomCode,
    joinCode,
    myColor,
    clientId,
    createRoom,
    joinRoom,
    closeWs,
    sendMove,
    sendUndoRequest,
    sendUndoAccept,
    sendUndoReject,
    sendRestart,
    sendChat,
    sendSignal,
    sendLeave
  }
}
