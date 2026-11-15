import { ref, computed } from 'vue'
import { useVoiceChat } from './useVoiceChat'

// 语音通话的 UI 粘合层：接线信令通道 + 来电弹窗 + 按钮图标/提示文案
export function useGomokuVoice({ online, setNotice }) {
  const showVoiceConfirm = ref(false)
  const incomingOffer = ref(null)

  const voice = useVoiceChat(
    (action, extra) => online.sendSignal(action, extra),
    {
      onError: (tip) => setNotice(tip),
      onIncomingCall: (sdp) => {
        incomingOffer.value = sdp
        showVoiceConfirm.value = true
      }
    }
  )
  const { voiceState } = voice

  // 语音按钮只保留图标，状态通过颜色/角标/动画区分
  const voiceIcon = computed(() => {
    if (voiceState.value === 'connected') return '🔊'
    if (voiceState.value === 'calling') return '📞'
    return '🎙️'
  })
  const voiceTitle = computed(() => {
    if (voiceState.value === 'connected') return '语音通话中，点击挂断'
    if (voiceState.value === 'calling') return '正在接通语音…'
    return '发起语音通话'
  })

  function toggleVoice() {
    if (voiceState.value === 'idle') {
      voice.startCall()
    } else {
      voice.hangUp()
    }
  }

  function acceptVoice() {
    showVoiceConfirm.value = false
    const sdp = incomingOffer.value
    incomingOffer.value = null
    if (sdp) {
      voice.acceptCall(sdp)
    }
  }

  function rejectVoice() {
    showVoiceConfirm.value = false
    voice.rejectCall()
    incomingOffer.value = null
  }

  return {
    voiceState,
    voiceIcon,
    voiceTitle,
    showVoiceConfirm,
    toggleVoice,
    acceptVoice,
    rejectVoice,
    hangUp: () => voice.hangUp(),
    handleSignal: (msg) => voice.handleSignal(msg)
  }
}
