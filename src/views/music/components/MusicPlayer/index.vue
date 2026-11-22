<template>
  <div
    class="qq-player"
    :class="{ 'lyrics-mode': page === 1 }"
    ref="rootRef"
    :style="bgStyle"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @mousedown="onMouseStart"
  >
    <div class="bg-layer" :style="bgGradientStyle"></div>
    <div class="bg-mask"></div>

    <!-- 顶部栏：歌曲/歌词 tab（无文案）+ 更多 -->
    <header class="top-bar">
      <div class="top-left"></div>
      <nav class="page-tabs" aria-label="页面切换">
        <button class="tab" :class="{ active: page === 0 }" :aria-label="'切到歌曲页'" @click="switchPage(0)"></button>
        <button class="tab" :class="{ active: page === 1 }" :aria-label="'切到歌词页'" @click="switchPage(1)"></button>
      </nav>
      <div class="top-right">
        <button class="top-btn" @click="showMore = true" aria-label="设置">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle cx="5" cy="12" r="2.5" fill="#000"></circle>
            <circle cx="12" cy="12" r="2.5" fill="#000"></circle>
            <circle cx="19" cy="12" r="2.5" fill="#000"></circle>
          </svg>
        </button>
      </div>
    </header>

    <!-- 左右滑动内容区：歌曲页 / 歌词页 -->
    <main
      class="content"
      :class="{ dragging }"
      :style="{ transform: `translateX(calc(${-page * 100}% + ${dragX}px))` }"
    >
      <!-- 歌曲页 -->
      <section class="page song-page">
        <SongPage
          :song="currentSong"
          :active-index="activePreviewIdx"
          :cur-line="currentLine.text"
          :next-line="nextLine.text"
          :has-lyrics="hasLyricLines"
          @open-lyrics="switchPage(1)"
        />
      </section>

      <!-- 歌词页 -->
      <section class="page lyrics-page">
        <LyricsDrawer
          :song="currentSong"
          :lyrics="lyrics"
          :current-time="currentTime"
          :active="page === 1"
          :is-playing="isPlaying"
          @seek="onSeek"
          @toggle-play="toggle"
          @update-current-index="onUpdateCurrentIndex"
        />
      </section>
    </main>

    <!-- 底部播放器（仅歌曲页显示） -->
    <transition name="footer-fade">
      <PlayerFooter
        v-if="page === 0"
        :current-time="currentTime"
        :duration="duration"
        :is-playing="isPlaying"
        :loop-mode="loopMode"
        @seek="onSeek"
        @seek-start="isSeeking = true"
        @seek-end="isSeeking = false"
        @toggle="toggle"
        @prev="prev"
        @next="next"
        @cycle-loop-mode="cycleLoopMode"
        @show-playlist="showPlaylist = true"
      />
    </transition>

    <!-- 音频实例为全局单例（src/utils/audioPlayer.js），独立于组件树，路由切换不断播放 -->

    <!-- 更多操作面板（定时关闭） -->
    <transition name="playlist-fade">
      <MorePanel
        v-if="showMore"
        :timer-options="timerOptions"
        :timer-minutes="timerMinutes"
        :remaining-time="remainingTime"
        @close="showMore = false"
        @set-timer="setTimer"
      />
    </transition>

    <!-- 播放列表弹层 -->
    <transition name="playlist-fade">
      <PlaylistPanel
        v-if="showPlaylist"
        :songs="songs"
        :current-index="currentIndex"
        :is-playing="isPlaying"
        @close="showPlaylist = false"
        @play-at="playAt"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue';
import LyricsDrawer from '../LyricsDrawer.vue';
import SongPage from './SongPage.vue';
import PlayerFooter from './PlayerFooter.vue';
import MorePanel from './MorePanel.vue';
import PlaylistPanel from './PlaylistPanel.vue';
import { getAssetUrl } from '../../../../utils/asset';
import audio, { playerState } from '../../../../utils/audioPlayer';
import { useLyrics } from './composables/useLyrics';
import { useSwipe } from './composables/useSwipe';
import { useSleepTimer } from './composables/useSleepTimer';

const props = defineProps({
  songs: { type: Array, required: true },
  initialIndex: { type: Number, default: 0 },
  autoPlay: { type: Boolean, default: true },
});
const emit = defineEmits(['song-change']);

const currentIndex = ref(props.initialIndex);
// keep-alive 缓存后组件不会重新挂载，需监听外部传入的索引变化（如从音乐列表切歌）
watch(() => props.initialIndex, (idx) => {
  if (idx !== currentIndex.value) currentIndex.value = idx;
});
const currentSong = computed(() => props.songs[currentIndex.value] || props.songs[0]);
const audioRef = ref(audio);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const loopMode = ref('list'); // list(顺序) | shuffle(随机) | one(单曲)
const page = ref(0); // 0 = 歌曲页, 1 = 歌词页
const showPlaylist = ref(false);
const showMore = ref(false);
const rootRef = ref(null);

// 歌词解析与同步
const { lyrics, activePreviewIdx, hasLyricLines, currentLine, nextLine, loadLyrics, updateActiveLine } = useLyrics();

// 定时关闭
const { timerOptions, timerMinutes, remainingTime, setTimer } = useSleepTimer();

// 左右滑动切换（面板打开或进度条拖动时禁用）
const dragX = ref(0);
const dragging = ref(false);
const isSeeking = ref(false);
const { onTouchStart, onTouchMove, onTouchEnd, onMouseStart } = useSwipe({
  page,
  dragX,
  dragging,
  isBlocked: () => showPlaylist.value || showMore.value || isSeeking.value,
});

watch(() => currentSong.value, async (song) => {
  emit('song-change', song, currentIndex.value);
  playerState.songId = song.id;
  await loadLyrics(song.lyrics);
  if (audioRef.value) {
    const newSrc = getAssetUrl(song.src);
    // src 未变化时不重设，避免同一首歌被重新加载打断播放
    if (!audioRef.value.src || !audioRef.value.src.endsWith(newSrc)) {
      audioRef.value.src = newSrc;
      audioRef.value.currentTime = 0;
    }
    if (props.autoPlay || isPlaying.value) {
      try { await audioRef.value.play(); } catch (e) { /* autoplay blocked */ }
    }
  }
});

// 音乐列表等外部直接切换全局音频时，同步播放器 UI 状态（索引/歌词）
watch(() => playerState.songId, (id) => {
  if (id == null || !props.songs.length) return;
  const idx = props.songs.findIndex((s) => s.id === id);
  if (idx !== -1 && idx !== currentIndex.value) currentIndex.value = idx;
});

function toggle() {
  if (!audioRef.value) return;
  if (audioRef.value.paused) audioRef.value.play(); else audioRef.value.pause();
}

function switchPage(p) {
  dragX.value = 0;
  dragging.value = false;
  page.value = p;
}

function prev() {
  if (audioRef.value && currentTime.value > 3) { audioRef.value.currentTime = 0; return; }
  const n = props.songs.length;
  if (loopMode.value === 'shuffle') {
    let idx;
    do { idx = Math.floor(Math.random() * n); } while (n > 1 && idx === currentIndex.value);
    currentIndex.value = idx;
  } else {
    currentIndex.value = (currentIndex.value - 1 + n) % n;
  }
}

function next() {
  const n = props.songs.length;
  if (loopMode.value === 'shuffle') {
    let idx;
    do { idx = Math.floor(Math.random() * n); } while (n > 1 && idx === currentIndex.value);
    currentIndex.value = idx;
  } else {
    currentIndex.value = (currentIndex.value + 1) % n;
  }
}

function cycleLoopMode() {
  const order = ['list', 'shuffle', 'one'];
  loopMode.value = order[(order.indexOf(loopMode.value) + 1) % order.length];
}

function onEnded() {
  if (loopMode.value === 'one') { audioRef.value.currentTime = 0; audioRef.value.play(); return; }
  next();
}

function onPlay() {
  isPlaying.value = true;
  playerState.playing = true;
  syncDuration();
}

function onPause() {
  isPlaying.value = false;
  playerState.playing = false;
}

function onTimeUpdate() {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  // 列表页已加载过元数据时，进入详情页不会再触发 loadedmetadata，这里兜底补齐
  if (!duration.value) syncDuration();
  updateActiveLine(currentTime.value);
}

function syncDuration() {
  if (!audioRef.value) return;
  const d = audioRef.value.duration;
  if (Number.isFinite(d) && d > 0) duration.value = d;
}

function onLoadedMetadata() {
  syncDuration();
}

function onSeek(t) {
  if (audioRef.value) audioRef.value.currentTime = t;
}

function onUpdateCurrentIndex(idx) {
  activePreviewIdx.value = idx;
}

function playAt(i) {
  showPlaylist.value = false;
  currentIndex.value = i;
}

// 背景：基于调色板生成模糊渐变 + 封面图作为全屏背景
const bgStyle = computed(() => {
  const s = currentSong.value;
  const palette = (s && s.palette && s.palette.length) ? s.palette : ['#232526', '#414345'];
  return { '--c1': palette[0], '--c2': palette[1] || palette[0], '--c3': palette[2] || palette[1] || palette[0] };
});

const bgGradientStyle = computed(() => {
  const s = currentSong.value;
  const palette = (s && s.palette && s.palette.length) ? s.palette : ['#232526', '#414345', '#232526'];
  // 有封面时使用封面图作为全屏背景（QQ 音乐风格），顶部/底部叠加渐变渐隐
  if (s && s.cover) {
    return {
      // 上面渐变：遮住顶部 tab 区；下面渐变：贴合底部文字信息
      backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0) 62%, rgba(0, 0, 0, 0.65) 100%), url(${getAssetUrl(s.cover)})`,
      backgroundSize: '100% auto',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {
    background: `radial-gradient(ellipse at 30% 30%, ${palette[0]} 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, ${palette[1] || palette[0]} 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, ${palette[2] || palette[1] || palette[0]} 0%, transparent 60%), #0a0a0a`,
  };
});

let keyHandler = null;

onMounted(async () => {
  // 全局音频事件监听
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('loadedmetadata', onLoadedMetadata);
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('play', onPlay);
  audio.addEventListener('pause', onPause);
  // 首次挂载：设置初始歌曲（若音频正在播放则保持播放状态）
  if (audioRef.value) {
    // 注意 audio.src 为浏览器规范化的绝对地址，必须用 endsWith 比较，
    // 否则同一首歌会被重复赋值 src 导致播放被打断
    if (!audioRef.value.src.endsWith(getAssetUrl(currentSong.value.src))) {
      audioRef.value.src = getAssetUrl(currentSong.value.src);
    }
    isPlaying.value = !audioRef.value.paused;
    playerState.songId = currentSong.value.id;
    playerState.playing = !audioRef.value.paused;
    // 主动同步已在列表页播放的音频时长/进度（loadedmetadata 可能早已触发过）
    syncDuration();
    currentTime.value = audioRef.value.currentTime || 0;
  }
  // 初始歌曲：加载歌词并自动播放（audio 此时已挂载）
  await loadLyrics(currentSong.value.lyrics);
  if (props.autoPlay && audioRef.value) {
    try { await audioRef.value.play(); } catch (e) { /* autoplay blocked */ }
  }
  // 原生监听 touchmove（passive:false），水平滑动才阻止默认
  if (rootRef.value) {
    rootRef.value.addEventListener('touchmove', onTouchMove, { passive: false });
  }
  // 快捷键仅在页面激活时监听（keep-alive 缓存期间避免影响其他页面）
  keyHandler = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') { if (audioRef.value) audioRef.value.currentTime = Math.max(0, audioRef.value.currentTime - 5); }
    else if (e.code === 'ArrowRight') { if (audioRef.value) audioRef.value.currentTime = Math.min(duration.value || 0, audioRef.value.currentTime + 5); }
  };
});

onActivated(() => {
  if (keyHandler) window.addEventListener('keydown', keyHandler);
});

onDeactivated(() => {
  if (keyHandler) window.removeEventListener('keydown', keyHandler);
});

onBeforeUnmount(() => {
  audio.removeEventListener('timeupdate', onTimeUpdate);
  audio.removeEventListener('loadedmetadata', onLoadedMetadata);
  audio.removeEventListener('ended', onEnded);
  audio.removeEventListener('play', onPlay);
  audio.removeEventListener('pause', onPause);
  if (keyHandler) window.removeEventListener('keydown', keyHandler);
});
</script>

<style scoped>
.qq-player {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #fff;
  overflow: hidden;
  background: #0a0a0a;
}

.bg-layer {
  position: absolute;
  inset: -40px;
  z-index: 0;
  transition: background-image 0.6s ease, background 0.6s ease, opacity 0.35s ease;
}

.bg-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.55) 75%, rgba(0, 0, 0, 0.85) 100%);
  pointer-events: none;
  transition: opacity 0.35s ease;
}

/* 歌词页：不需要封面背景，淡出回到纯色深底 */
.qq-player.lyrics-mode .bg-layer,
.qq-player.lyrics-mode .bg-mask {
  opacity: 0;
}

/* 顶部栏：tab + 更多 */
.top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
}

.top-left, .top-right {
  width: 40px;
  flex-shrink: 0;
}

.top-right {
  display: flex;
  justify-content: flex-end;
}

.page-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab {
  background: #fff;
  border: none;
  width: 3px;
  height: 3px;
  padding: 0;
  cursor: pointer;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transition: width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.tab.active {
  width: 10px;
}

.top-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  width: 144lpx;
  height: 72lpx;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.top-btn:hover { background: rgba(255, 255, 255, 0.08); }

/* 滑动内容区 */
.content {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  transition: transform 0.32s cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform;
}

.content.dragging { transition: none; }

.page {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* 歌曲页 */
.song-page {
  display: flex;
  flex-direction: column;
  justify-content: end;
  text-align: left;
  background: linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 1) 72%, rgba(0, 0, 0, 1) 100%);
}

/* 歌词页 */
.lyrics-page {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 底部播放器淡入淡出 */
.footer-fade-enter-active, .footer-fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.footer-fade-enter-from, .footer-fade-leave-to { opacity: 0; transform: translateY(12lpx); }

.playlist-fade-enter-active, .playlist-fade-leave-active { transition: opacity 0.25s; }
.playlist-fade-enter-from, .playlist-fade-leave-to { opacity: 0; }
</style>
