// 语音播报工具：基于浏览器原生 Web Speech API（无需音频资源）
// 注意：部分浏览器要求用户手势后才允许发声，因此仅在点击场景调用

export function speak(text, { lang = 'zh-CN', rate = 1 } = {}) {
  if (!text || typeof window === 'undefined') return false
  if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
    return false
  }
  try {
    // 打断上一条播报，避免排队堆积
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
    return true
  } catch (e) {
    return false
  }
}

export function stopSpeak() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch (e) {
      /* ignore */
    }
  }
}
