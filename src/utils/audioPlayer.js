import { reactive } from 'vue'
import { getAssetUrl } from './asset'

// 全局唯一的音频实例：独立于 Vue 组件树存在，
// 路由切换（页面缓存/卸载）不会导致音频元素脱离文档而暂停
const audio = new Audio()
audio.preload = 'metadata'

// 全局播放状态（供音乐列表等页面展示当前播放项）
export const playerState = reactive({
  songId: null, // 当前播放歌曲 id
  playing: false, // 是否正在播放
})

// 模块级同步播放状态：无论哪个页面发起播放/暂停，playerState 始终准确
// （不依赖 MusicPlayer 组件是否挂载）
audio.addEventListener('play', () => {
  playerState.playing = true
})
audio.addEventListener('pause', () => {
  playerState.playing = false
})
audio.addEventListener('ended', () => {
  playerState.playing = false
})

/**
 * 全局切歌：直接控制音频实例并同步播放状态，
 * 页面组件通过监听 playerState.songId 同步各自的 UI
 */
export function playSong(song) {
  if (!song) return
  const newSrc = getAssetUrl(song.src)
  // 同一首歌不重置 src/进度，实现暂停后恢复续播
  if (!audio.src || !audio.src.endsWith(newSrc)) {
    audio.src = newSrc
    audio.currentTime = 0
  }
  audio.play().catch(() => {})
  playerState.songId = song.id
}

export default audio

