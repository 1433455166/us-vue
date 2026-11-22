import { ref, computed } from 'vue'
import { getAssetUrl } from '../../../../../utils/asset'

// 歌词解析、加载与播放进度同步
export function useLyrics() {
  const lyrics = ref([])
  const activePreviewIdx = ref(0)

  function parseLyrics(text) {
    const lines = text.split(/\r?\n/)
    const result = []
    const re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/
    for (const line of lines) {
      const m = line.match(re);
      if (!m) continue;
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const time = min * 60 + sec + ms / 1000;
      const textContent = line.replace(re, '').trim();
      result.push({ time, text: textContent });
    }
    return result.sort((a, b) => a.time - b.time);
  }

  // 仅保留有内容的歌词行（用于显示/同步）
  const lyricLines = computed(() => lyrics.value.filter((l) => l.text))
  const hasLyricLines = computed(() => lyricLines.value.length > 0)

  // 当前歌词 + 下一条歌词（两句轮播）
  const currentLine = computed(() => lyricLines.value[activePreviewIdx.value] || { text: '' })
  const nextLine = computed(() => lyricLines.value[activePreviewIdx.value + 1] || { text: '' })

  async function loadLyrics(url) {
    if (!url) { lyrics.value = []; return; }
    try {
      const res = await fetch(getAssetUrl(url));
      const text = await res.text();
      lyrics.value = parseLyrics(text);
    } catch (e) {
      lyrics.value = [];
    }
  }

  // 根据播放进度二分定位当前歌词行
  function updateActiveLine(currentTime) {
    const lines = lyricLines.value;
    if (!lines.length) return;
    let lo = 0, hi = lines.length - 1, idx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].time <= currentTime) { idx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    activePreviewIdx.value = idx;
  }

  return {
    lyrics,
    activePreviewIdx,
    lyricLines,
    hasLyricLines,
    currentLine,
    nextLine,
    loadLyrics,
    updateActiveLine,
  }
}
