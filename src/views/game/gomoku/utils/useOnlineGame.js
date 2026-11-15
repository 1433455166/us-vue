import { ref } from 'vue'
import { ADDRESS } from '../../../../common/enum.ts'
import { BLACK, WHITE } from './gomoku.constants'

// 联机对战：复用 Chat 页面的 WebSocket 广播通道（ADDRESS/chat），
// 通过 JSON 消息 + 房间号过滤实现双人联机，无需后端改动。
// 注意：Java 服务器广播时会加 "[会话id]: " 前缀，解析时需剥离。
//
// 围观与房间列表（同样无需后端改动，均基于全局广播 + 客户端过滤）：
// - 对局已开局时收到 join：房主下发 sync（棋谱回放），后来者转为观众
// - 观众每 WATCH_HEARTBEAT_MS 发一次 watch 心跳（带昵称），
//   房间内所有客户端据此维护观众名单，超时未续约自动剔除
// - 房主每 LOBBY_HEARTBEAT_MS 向 room:'lobby' 广播 room-hb 心跳，
//   开局页监听后展示实时房间列表；房主离开时广播 room-close 即时下架
const WATCH_HEARTBEAT_MS = 10000
const LOBBY_HEARTBEAT_MS = 10000
const LOBBY_PING_MS = 25000
const PRESENCE_EXPIRE_MS = 30000

function createWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  if (window.location.protocol === 'https:') {
    // HTTPS 页面受混合内容策略限制无法直连 ws:// 后端，
    // 改连当前域名下的 /chat（由 vite dev server 的 WebSocket 代理转发）
    return `${protocol}//${window.location.host}/chat`
  }
  return `${protocol}//${ADDRESS}/chat`
}

// 解析服务器广播消息（剥离 "[会话id]: " 前缀），无 JSON 内容时返回 null
function parseMsg(raw) {
  if (typeof raw !== 'string') return null
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch (e) {
    return null
  }
}

// 观众昵称：本地生成并持久化，随 watch 心跳广播给房间内所有人
function ensureNickname() {
  const KEY = 'gk-nickname'
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved
    const pool = [
      '吃瓜群众',
      '观棋不语',
      '路过棋友',
      '小板凳',
      '围观侠',
      '棋盘外的人',
      '潜水员',
      '隐身高手'
    ]
    const name =
      pool[Math.floor(Math.random() * pool.length)] +
      '-' +
      Math.floor(Math.random() * 90 + 10)
    localStorage.setItem(KEY, name)
    return name
  } catch (e) {
    return '观众' + Math.floor(Math.random() * 90 + 10)
  }
}

export function useOnlineGame({
  onStart,
  onSync, // 收到房主棋局同步：以观众身份进入对局
  onResync, // 断线重连后的棋局补齐：保持原角色回放
  onRemoteMove,
  onRequestUndo,
  onUndoAccept,
  onUndoReject,
  onChat,
  onVoiceSignal,
  onRestart,
  onLeave,
  getHistory // 房主下发 sync 时提供当前棋谱
}) {
  const ws = ref(null)
  const onlineStage = ref('idle') // idle 未开始 / waiting 等待对手 / playing 对局中
  const onlineTip = ref('')
  const roomCode = ref('')
  const joinCode = ref('')
  const myColor = ref(0)
  const clientId = 'gk-' + Math.random().toString(36).slice(2, 10)
  const nickname = ref(ensureNickname())
  const role = ref('player') // player 对局者 / spectator 围观者
  const isHost = ref(false)
  // 围观名单：[{ id, name, seenAt }]，所有人（含观众自己）实时维护
  const spectators = ref([])
  // 大堂房间列表：[{ code, started, spectators, seenAt }]
  const rooms = ref([])
  let joinTimer = null
  let watchTimer = null
  let roomHbTimer = null
  let pruneTimer = null
  let reconnectTimer = null
  let resumeTimer = null
  let lobbyWs = null
  let lobbyPingTimer = null
  let lobbyAuto = false

  function createRoom() {
    // 重复创建时先把旧房间从大堂下架，避免列表残留
    if (isHost.value && roomCode.value) {
      sendLobby('room-close', { code: roomCode.value })
    }
    roomCode.value = String(Math.floor(1000 + Math.random() * 9000))
    isHost.value = true
    role.value = 'player'
    connectWs(() => {
      onlineStage.value = 'waiting'
      onlineTip.value = '房间已创建，请用另一台设备加入（点击下方按钮复制链接）'
      startRoomHeartbeat()
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
    isHost.value = false
    role.value = 'player'
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

  // 重连成功后的状态恢复：对局中请求全量棋谱补齐，等待中恢复心跳
  function reconnectOnOpen() {
    onlineTip.value = ''
    if (onlineStage.value === 'playing') {
      sendMsg('resume', { color: myColor.value })
      clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        if (onlineStage.value === 'playing') {
          onlineTip.value = '重连成功，但房间内已无其他玩家，可返回主页重新开始'
        }
      }, 6000)
    } else if (onlineStage.value === 'waiting') {
      startRoomHeartbeat()
    }
  }

  function connectWs(onOpen) {
    closeWs()
    onlineTip.value = '正在连接服务器…'
    const socket = new WebSocket(createWsUrl())
    ws.value = socket
    socket.onopen = () => {
      if (ws.value !== socket) return
      onOpen && onOpen()
      // 观众名单超时清理（仅房间连接）
      clearInterval(pruneTimer)
      pruneTimer = setInterval(pruneSpectators, WATCH_HEARTBEAT_MS)
    }
    socket.onmessage = (event) => handleGameMsg(event.data)
    socket.onerror = () => {
      if (ws.value !== socket) return
      onlineTip.value = `连接服务器失败（${ADDRESS}），请确认后端服务可用`
    }
    socket.onclose = () => {
      if (ws.value !== socket) return
      ws.value = null
      const active =
        onlineStage.value === 'playing' || onlineStage.value === 'waiting'
      if (!active) {
        onlineTip.value = '连接已断开'
        return
      }
      // 对局中/等待中意外断开（如手机切后台）：自动重连并补齐状态
      onlineTip.value = '连接已断开，正在重连…'
      clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        connectWs(reconnectOnOpen)
      }, 2000)
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
    clearTimeout(reconnectTimer)
    clearTimeout(resumeTimer)
    stopWatchHeartbeat()
    stopRoomHeartbeat()
    clearInterval(pruneTimer)
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

  /* ---------- 大堂（房间列表） ---------- */
  function sendLobby(action, info) {
    const socket = ws.value
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(
      JSON.stringify({ app: 'gomoku', room: 'lobby', from: clientId, action, info })
    )
  }

  function roomInfo() {
    return {
      code: roomCode.value,
      started: onlineStage.value === 'playing',
      spectators: spectators.value.length
    }
  }

  // 房主心跳：向大堂广播房间存活状态
  function startRoomHeartbeat() {
    stopRoomHeartbeat()
    if (!isHost.value) return
    sendLobby('room-hb', roomInfo())
    roomHbTimer = setInterval(() => sendLobby('room-hb', roomInfo()), LOBBY_HEARTBEAT_MS)
  }

  function stopRoomHeartbeat() {
    clearInterval(roomHbTimer)
    roomHbTimer = null
  }

  // 房主主动关闭房间：通知大堂即时下架
  function closeRoom() {
    if (isHost.value) {
      sendLobby('room-close', { code: roomCode.value })
    }
    isHost.value = false
  }

  function upsertRoom(info) {
    if (!info || !/^\d{4}$/.test(String(info.code))) return
    const now = Date.now()
    const list = rooms.value.filter(
      (r) => r.code !== String(info.code) && now - r.seenAt < PRESENCE_EXPIRE_MS
    )
    list.push({
      code: String(info.code),
      started: !!info.started,
      spectators: Number(info.spectators) || 0,
      seenAt: now
    })
    rooms.value = list
  }

  // 进开局页的大堂连接：只听 room-hb / room-close，维护实时房间列表
  function enterLobby() {
    if (lobbyWs) return
    lobbyAuto = true
    let socket
    try {
      socket = new WebSocket(createWsUrl())
    } catch (e) {
      return
    }
    lobbyWs = socket
    socket.onopen = () => {
      if (lobbyWs !== socket) return
      // 定期 ping 保持连接活跃
      clearInterval(lobbyPingTimer)
      lobbyPingTimer = setInterval(() => {
        try {
          if (lobbyWs === socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({ app: 'gomoku', room: 'lobby', from: clientId, action: 'ping' })
            )
          }
        } catch (e) {
          /* ignore */
        }
      }, LOBBY_PING_MS)
    }
    socket.onmessage = (event) => {
      const msg = parseMsg(event.data)
      if (!msg || msg.app !== 'gomoku') return
      if (msg.action === 'room-hb') {
        upsertRoom(msg.info)
      } else if (msg.action === 'room-close') {
        const code = msg.info && msg.info.code
        rooms.value = rooms.value.filter((r) => r.code !== String(code))
      }
    }
    socket.onclose = () => {
      if (lobbyWs !== socket) return
      lobbyWs = null
      clearInterval(lobbyPingTimer)
      // 页面停留在大堂时断线自动重连，保持列表实时
      if (lobbyAuto) {
        setTimeout(() => {
          if (lobbyAuto) enterLobby()
        }, 2000)
      }
    }
  }

  function leaveLobby() {
    lobbyAuto = false
    clearInterval(lobbyPingTimer)
    const socket = lobbyWs
    lobbyWs = null
    rooms.value = []
    if (socket) {
      try {
        socket.onclose = null
        socket.close()
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ---------- 围观 ---------- */
  function touchSpectator(id, name) {
    const now = Date.now()
    const list = spectators.value.filter(
      (s) => s.id !== id && now - s.seenAt < PRESENCE_EXPIRE_MS
    )
    list.push({ id, name, seenAt: now })
    spectators.value = list
  }

  function pruneSpectators() {
    const now = Date.now()
    spectators.value = spectators.value.filter((s) => now - s.seenAt < PRESENCE_EXPIRE_MS)
  }

  // 观众心跳：宣告自己还在围观（名单即由此统计）
  function startWatchHeartbeat() {
    if (role.value !== 'spectator') return
    stopWatchHeartbeat()
    // 进入围观：即时通知房间内所有人，人数立刻 +1
    sendMsg('watch-enter', { name: nickname.value })
    const beat = () => {
      sendMsg('watch', { name: nickname.value })
      touchSpectator(clientId, `${nickname.value}（我）`)
    }
    beat()
    watchTimer = setInterval(beat, WATCH_HEARTBEAT_MS)
  }

  function stopWatchHeartbeat() {
    clearInterval(watchTimer)
    watchTimer = null
  }

  // 观众离开：即时通知房间内所有人，人数立刻 -1
  function leaveWatch() {
    if (role.value !== 'spectator') return
    sendMsg('watch-leave')
    stopWatchHeartbeat()
    role.value = 'player'
  }

  // 切后台：仅暂停心跳并通知名单移除，保留观众身份，回前台后恢复
  function pauseWatch() {
    if (role.value !== 'spectator') return
    sendMsg('watch-leave')
    stopWatchHeartbeat()
  }

  function resumeWatch() {
    startWatchHeartbeat()
  }

  // 房主：向后来者下发当前棋局（target 指定断线重连的恢复对象）
  function sendSync(target) {
    const history =
      typeof getHistory === 'function'
        ? getHistory()
        : []
    sendMsg('sync', { started: true, history, ...(target ? { target } : {}) })
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
    role.value = 'player'
    onlineStage.value = 'playing'
    onlineTip.value = ''
    onStart(color)
  }

  function handleGameMsg(raw) {
    const msg = parseMsg(raw)
    if (!msg || msg.app !== 'gomoku' || msg.room !== roomCode.value) return
    if (msg.from === clientId) return // 过滤服务器回显给自己的消息

    switch (msg.action) {
      case 'join': // 我是房主，对手申请加入
        if (role.value !== 'player' || !isHost.value) return
        if (onlineStage.value === 'waiting') {
          sendMsg('start')
          beginOnlineGame(BLACK)
        } else if (onlineStage.value === 'playing') {
          // 已开局：后来者转为围观，下发当前棋局
          sendSync()
        }
        break
      case 'start': // 我是加入方，房主确认开局
        if (role.value === 'player' && onlineStage.value !== 'playing') {
          beginOnlineGame(WHITE)
        }
        break
      case 'sync': // 棋局全量同步
        if (msg.target && msg.target === clientId) {
          // 自己断线重连后的恢复包：保持原角色，仅补齐棋局
          clearTimeout(resumeTimer)
          onResync(msg)
          startWatchHeartbeat()
          break
        }
        // 已在对局/围观中的客户端忽略（只有申请加入者需要回放）
        if (onlineStage.value === 'playing') return
        onSync(msg)
        startWatchHeartbeat()
        break
      case 'resume': // 有人断线重连：任一在线对局者下发全量棋谱帮其恢复
        if (
          role.value === 'player' &&
          onlineStage.value === 'playing' &&
          msg.color !== myColor.value
        ) {
          sendSync(msg.from)
        }
        break
      case 'move':
        onRemoteMove(msg)
        break
      case 'watch': // 观众心跳，更新围观名单
        if (onlineStage.value === 'playing') {
          const name =
            typeof msg.name === 'string' && msg.name.trim()
              ? msg.name.trim().slice(0, 12)
              : '观众'
          touchSpectator(msg.from, name)
        }
        break
      case 'watch-enter': // 观众进入：名单即时 +1
        if (onlineStage.value === 'playing') {
          const enterName =
            typeof msg.name === 'string' && msg.name.trim()
              ? msg.name.trim().slice(0, 12)
              : '观众'
          touchSpectator(msg.from, enterName)
        }
        break
      case 'watch-leave': // 观众离开：名单即时 -1
        spectators.value = spectators.value.filter((s) => s.id !== msg.from)
        break
      case 'undo-request': {
        // 对方请求悔棋，等待本方确认（观众不参与）。
        // 只允许悔"最新一手"：请求方的颜色必须等于最后一子的颜色，
        // 对手落子后其悔棋请求直接忽略
        if (
          role.value !== 'player' ||
          onlineStage.value !== 'playing' ||
          (msg.color !== BLACK && msg.color !== WHITE)
        ) {
          break
        }
        const undoHist =
          typeof getHistory === 'function' ? getHistory() : []
        const lastSeq = undoHist.length - 1
        if (lastSeq >= 0 && (lastSeq % 2 === 0 ? BLACK : WHITE) === msg.color) {
          onRequestUndo(msg.color)
        }
        break
      }
      case 'undo-accept': // 对方同意悔棋，按请求方颜色回放撤销（观众同步回放）
        if (msg.color === BLACK || msg.color === WHITE) {
          onUndoAccept(msg.color)
        }
        break
      case 'undo-reject': // 对方拒绝悔棋
        onUndoReject()
        break
      case 'chat': // 弹幕（voice=true 的快捷语需要播报语音），观众同样可收发
        if (
          typeof msg.text === 'string' &&
          msg.text.trim() &&
          msg.text.length <= 50
        ) {
          onChat(msg.text, msg.voice === true)
        }
        break
      case 'voice-offer': // 语音信令统一透传（观众不参与语音）
      case 'voice-answer':
      case 'voice-ice':
      case 'voice-reject':
      case 'voice-end':
        if (role.value === 'player' && onlineStage.value === 'playing') {
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
    nickname,
    role,
    spectators,
    rooms,
    createRoom,
    joinRoom,
    closeWs,
    closeRoom,
    enterLobby,
    leaveLobby,
    leaveWatch,
    pauseWatch,
    resumeWatch,
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
