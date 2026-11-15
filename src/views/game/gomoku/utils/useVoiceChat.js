import { ref } from 'vue'

// 公共 STUN 服务器：用于 NAT 穿透获取候选地址（同一局域网内通常直接走 host 候选）
const ICE_SERVERS = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302'
    ]
  }
]

// 对战双方实时语音：WebRTC 音频流 + 信令复用房间广播通道
// 状态：idle 未通话 / calling 呼叫或接通中 / connected 已接通
export function useVoiceChat(sendSignal, { onError, onIncomingCall }) {
  const voiceState = ref('idle')
  let pc = null
  let localStream = null
  let remoteAudio = null
  let role = null // caller / callee
  let pendingCandidates = []
  let callTimer = null

  // 我方发起语音：获取麦克风并发出 offer
  async function startCall() {
    if (voiceState.value !== 'idle') return
    if (!window.isSecureContext) {
      onError('语音需要 HTTPS 环境，当前 HTTP 地址无法使用麦克风')
      return
    }
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      onError('当前浏览器不支持语音通话')
      return
    }
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      onError('无法获取麦克风权限，请检查浏览器设置')
      return
    }
    voiceState.value = 'calling'
    role = 'caller'
    createPeer()
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignal('voice-offer', { sdp: pc.localDescription })
    // 15 秒未接听自动取消
    clearTimeout(callTimer)
    callTimer = setTimeout(() => {
      if (voiceState.value === 'calling' && role === 'caller') {
        hangUp()
        onError('对方未响应语音邀请')
      }
    }, 15000)
  }

  // 我方接听：收到对方的确认后由主流程调用
  async function acceptCall(offerSdp) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      sendSignal('voice-reject')
      onError('无法获取麦克风权限，已拒绝接听')
      return
    }
    role = 'callee'
    createPeer()
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp })
    flushCandidates()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    sendSignal('voice-answer', { sdp: pc.localDescription })
    voiceState.value = 'calling'
  }

  function rejectCall() {
    sendSignal('voice-reject')
  }

  // 挂断：通知对方并清理资源
  function hangUp() {
    if (voiceState.value !== 'idle') {
      sendSignal('voice-end')
    }
    clearTimeout(callTimer)
    cleanup()
    voiceState.value = 'idle'
  }

  // 处理对方发来的语音信令
  function handleSignal(msg) {
    switch (msg.action) {
      case 'voice-offer':
        // 忙线时自动拒绝
        if (pc || voiceState.value !== 'idle') {
          sendSignal('voice-reject')
          return
        }
        onIncomingCall(msg.sdp)
        break
      case 'voice-answer':
        if (!pc || role !== 'caller') return
        clearTimeout(callTimer)
        pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }).catch(() => {})
        flushCandidates()
        break
      case 'voice-ice':
        if (!pc) {
          pendingCandidates.push(msg.candidate)
          return
        }
        if (msg.candidate) {
          pc.addIceCandidate(msg.candidate).catch(() => {})
        }
        break
      case 'voice-reject':
        clearTimeout(callTimer)
        cleanup()
        voiceState.value = 'idle'
        onError('对方拒绝了语音通话')
        break
      case 'voice-end':
        clearTimeout(callTimer)
        cleanup()
        voiceState.value = 'idle'
        onError('对方已挂断语音')
        break
      default:
        break
    }
  }

  function createPeer() {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('voice-ice', { candidate: e.candidate.toJSON() })
      }
    }
    pc.ontrack = (e) => {
      // 播放对方声音
      if (!remoteAudio) {
        remoteAudio = new Audio()
        remoteAudio.autoplay = true
      }
      remoteAudio.srcObject = e.streams[0]
      remoteAudio.play().catch(() => {})
    }
    pc.oniceconnectionstatechange = () => {
      if (!pc) return
      const state = pc.iceConnectionState
      if (state === 'connected' || state === 'completed') {
        voiceState.value = 'connected'
      } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        clearTimeout(callTimer)
        cleanup()
        voiceState.value = 'idle'
        onError('语音连接已断开')
      }
    }
  }

  // 处理早于 answer 到达的 ICE 候选
  function flushCandidates() {
    pendingCandidates.forEach((c) => {
      if (pc && c) pc.addIceCandidate(c).catch(() => {})
    })
    pendingCandidates = []
  }

  function cleanup() {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      localStream = null
    }
    if (remoteAudio) {
      remoteAudio.srcObject = null
      remoteAudio = null
    }
    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.oniceconnectionstatechange = null
      try {
        pc.close()
      } catch (e) {
        /* ignore */
      }
      pc = null
    }
    pendingCandidates = []
    role = null
  }

  return {
    voiceState,
    startCall,
    acceptCall,
    rejectCall,
    handleSignal,
    hangUp
  }
}
