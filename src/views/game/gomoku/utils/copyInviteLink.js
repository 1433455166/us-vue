// 复制邀请链接：兼容 HTTP 环境（局域网 IP 访问），clipboard API 不可用时回退 execCommand
export function copyInviteLink(url, setTip) {
  const fallbackShow = () => {
    setTip(`复制失败，请手动复制：${url}`)
  }
  const legacyCopy = () => {
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      setTip(ok ? '链接已复制，发给好友即可加入' : '')
      if (!ok) fallbackShow()
    } catch (e) {
      fallbackShow()
    }
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(url)
      .then(() => setTip('链接已复制，发给好友即可加入'))
      .catch(legacyCopy)
  } else {
    legacyCopy()
  }
}
