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
        <div class="song-info">
          <div class="title-row">
            <h1 class="song-title">{{ currentSong.title }}</h1>
            <div class="social">
              <span class="social-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{{ formatCount(commentCount) }}</span>
              </span>
              <span class="social-item" :class="{ liked: liked }" @click.stop="toggleLike">
                <svg viewBox="0 0 24 24" width="16" height="16" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{{ formatCount(likeCount) }}</span>
              </span>
            </div>
          </div>
          <p class="artist">{{ currentSong.artist }}</p>
          <p class="meta" v-if="metaLine">{{ metaLine }}</p>
        </div>

        <!-- 两条歌词轮播：当前 + 下一条，点击歌词本身进入歌词页（QQ 音乐风格：上半部分居中） -->
        <div class="lyric-snippet" v-if="hasLyricLines" @click="switchPage(1)">
          <Transition name="lyric-up">
            <div class="lyric-group" :key="activePreviewIdx">
              <p class="cur-line">{{ currentLine.text }}</p>
              <p class="next-line">{{ nextLine.text }}</p>
            </div>
          </Transition>
        </div>
        <div class="lyric-snippet" v-else @click="switchPage(1)">
          <p class="cur-line">暂无歌词</p>
        </div>
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
      <footer v-if="page === 0" class="player-bottom">
      <div class="progress-row">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <div class="progress" ref="progressRef" @click="seek">
          <div class="progress-bar" :style="{ width: progressPercent + '%' }">
            <div class="progress-dot"></div>
          </div>
        </div>
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <div class="controls">
        <button class="ctrl-btn" @click="cycleLoopMode" :class="{ active: loopMode !== 'list' }" aria-label="播放模式">
          <!-- 随机 -->
          <svg v-if="loopMode === 'shuffle'" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
          </svg>
          <!-- 顺序 / 单曲循环 -->
          <svg v-else viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          <span v-if="loopMode === 'one'" class="badge">1</span>
        </button>

        <button class="ctrl-btn" @click="prev" aria-label="上一首">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
            <path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"></path>
          </svg>
        </button>

        <button class="ctrl-btn play" @click="toggle" :class="{ playing: isPlaying }" aria-label="播放">
          <SvgPlay v-if="!isPlaying" :size="40" />
          <SvgPause v-else :size="40" />
        </button>

        <button class="ctrl-btn" @click="next" aria-label="下一首">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
            <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"></path>
          </svg>
        </button>

        <button class="ctrl-btn" @click="showPlaylist = true" aria-label="播放列表">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
      </div>
      </footer>
    </transition>

    <!-- 音频元素 -->
    <audio
      ref="audioRef"
      :src="currentSong.src"
      :playbackRate="rate"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      preload="metadata"
    ></audio>

    <!-- 更多操作面板（定时关闭 / 倍速 / 收藏） -->
    <transition name="playlist-fade">
      <div v-if="showMore" class="playlist-mask" @click.self="showMore = false">
        <transition name="playlist-slide" appear>
          <div v-if="showMore" class="playlist-panel more-panel">
            <div class="playlist-header">
              <h3>更多</h3>
              <button
                class="close-btn"
                @click="showMore = false"
                aria-label="关闭"
              >
                <SvgClose variant="line" :size="20" />
              </button>
            </div>
            <div class="more-body">
              <section class="more-section">
                <p class="more-label">定时关闭</p>
                <div class="more-options">
                  <button
                    v-for="m in timerOptions"
                    :key="m"
                    class="more-opt"
                    :class="{ active: timerMinutes === m }"
                    @click="setTimer(m)"
                  >
                    {{ m === 0 ? '关闭' : m + '分钟' }}
                  </button>
                </div>
                <p v-if="timerMinutes > 0" class="timer-hint">
                  将在 {{ formatTime(remainingTime) }} 后停止播放
                </p>
              </section>
              <!-- <section class="more-section">
                <p class="more-label">倍速播放</p>
                <div class="more-options">
                  <button
                    v-for="r in rateOptions"
                    :key="r"
                    class="more-opt"
                    :class="{ active: rate === r }"
                    @click="setRate(r)"
                  >
                    {{ r }}x
                  </button>
                </div>
              </section> -->
              <!-- <section class="more-section">
                <p class="more-label">操作</p>
                <div class="more-options">
                  <button class="more-opt" :class="{ active: liked }" @click="toggleLike">
                    收藏{{ liked ? '（已收藏）' : '' }}
                  </button>
                </div>
              </section> -->
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 播放列表弹层 -->
    <transition name="playlist-fade">
      <div v-if="showPlaylist" class="playlist-mask" @click.self="showPlaylist = false">
        <transition name="playlist-slide" appear>
          <div v-if="showPlaylist" class="playlist-panel">
            <div class="playlist-header">
              <h3>播放列表 <span class="count">({{ songs.length }})</span></h3>
              <button
                class="close-btn"
                @click="showPlaylist = false"
                aria-label="关闭"
              >
                <SvgClose variant="line" :size="20" />
              </button>
            </div>
            <ul class="playlist">
              <li
                v-for="(song, idx) in songs"
                :key="song.id"
                :class="{ active: idx === currentIndex, playing: idx === currentIndex && isPlaying }"
                @click="playAt(idx)"
              >
                <span class="pl-index">{{ idx === currentIndex && isPlaying ? '♪' : idx + 1 }}</span>
                <div class="pl-info">
                  <p class="pl-title">{{ song.title }}</p>
                  <p class="pl-divider">-</p>
                  <p class="pl-artist">{{ song.artist }}</p>
                </div>
                <span class="pl-duration">{{ song.duration }}</span>
              </li>
            </ul>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import LyricsDrawer from './LyricsDrawer.vue';
import SvgPlay from './svgIcon/SvgPlay.vue';
import SvgPause from './svgIcon/SvgPause.vue';
import SvgClose from './svgIcon/SvgClose.vue';
import { getLengthPxByRatio } from '../utils/lpx';

const props = defineProps({
  songs: { type: Array, required: true },
  initialIndex: { type: Number, default: 0 },
  autoPlay: { type: Boolean, default: true },
});
const emit = defineEmits(['song-change']);

const currentIndex = ref(props.initialIndex);
const currentSong = computed(() => props.songs[currentIndex.value] || props.songs[0]);
const audioRef = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const lyrics = ref([]);
const liked = ref(false);
const likeCount = ref(0);
const commentCount = ref(0);
const loopMode = ref('list'); // list(顺序) | shuffle(随机) | one(单曲)
const page = ref(0); // 0 = 歌曲页, 1 = 歌词页
const showPlaylist = ref(false);
const showMore = ref(false);
const progressRef = ref(null);
const rootRef = ref(null);
const activePreviewIdx = ref(0);

// 更多面板：定时关闭 + 倍速
const timerOptions = [0, 10, 20, 30, 60];
const rateOptions = [0.5, 1, 1.25, 1.5, 2];
const timerMinutes = ref(0);
const remainingTime = ref(0);
const rate = ref(1);
let timerId = null;

function setTimer(m) {
  timerMinutes.value = m;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (m > 0) {
    remainingTime.value = m * 60;
    timerId = setInterval(() => {
      remainingTime.value -= 1;
      if (remainingTime.value <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerMinutes.value = 0;
        if (audioRef.value) audioRef.value.pause();
      }
    }, 1000);
  }
}

function setRate(r) {
  rate.value = r;
  if (audioRef.value) audioRef.value.playbackRate = r;
}

// 播放列表关闭按钮尺寸：64lpx 换算当前视口实际像素
const closeBtnSize = ref(getLengthPxByRatio(1, 64));
function updateCloseBtnSize() {
  closeBtnSize.value = getLengthPxByRatio(1, 64);
}

// 滑动切换状态
const dragX = ref(0);
const dragging = ref(false);
let touchStartX = 0;
let touchStartY = 0;
let isHorizontal = null;
let rawDx = 0; // 触摸原始水平位移（未被钳制，用于松手判断）
let mouseDownX = 0;
let mouseDownY = 0;
let rawMouseDx = 0; // 鼠标原始水平位移

// 解析歌词
function parseLyrics(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  const re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/;
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
const lyricLines = computed(() => lyrics.value.filter((l) => l.text));
const hasLyricLines = computed(() => lyricLines.value.length > 0);

// 当前歌词 + 下一条歌词（两句轮播）
const currentLine = computed(() => lyricLines.value[activePreviewIdx.value] || { text: '' });
const nextLine = computed(() => lyricLines.value[activePreviewIdx.value + 1] || { text: '' });

async function loadLyrics(url) {
  if (!url) { lyrics.value = []; return; }
  try {
    const res = await fetch(url);
    const text = await res.text();
    lyrics.value = parseLyrics(text);
  } catch (e) {
    lyrics.value = [];
  }
}

function initSongData(song) {
  const seed = song.id * 1314;
  likeCount.value = 9000 + (seed % 5000);
  commentCount.value = 10000 + (seed % 8000);
  liked.value = false;
}

initSongData(currentSong.value);

watch(() => currentSong.value, async (song) => {
  emit('song-change', song, currentIndex.value);
  initSongData(song);
  await loadLyrics(song.lyrics);
  if (audioRef.value) {
    audioRef.value.currentTime = 0;
    if (props.autoPlay || isPlaying.value) {
      try { await audioRef.value.play(); } catch (e) { /* autoplay blocked */ }
    }
  }
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

function onTimeUpdate() {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
  updateActiveLine();
}

function onLoadedMetadata() {
  if (audioRef.value) duration.value = audioRef.value.duration || 0;
}

function onSeek(t) {
  if (audioRef.value) audioRef.value.currentTime = t;
}

function seek(e) {
  if (!progressRef.value || !audioRef.value) return;
  const rect = progressRef.value.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audioRef.value.currentTime = ratio * (duration.value || 0);
}

function updateActiveLine() {
  const lines = lyricLines.value;
  if (!lines.length) return;
  let lo = 0, hi = lines.length - 1, idx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= currentTime.value) { idx = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  activePreviewIdx.value = idx;
}

function onUpdateCurrentIndex(idx) {
  activePreviewIdx.value = idx;
}

// 触摸滑动切换（touchmove 由 onMounted 原生监听，passive:false 以便条件阻止）
function onTouchStart(e) {
  if (showPlaylist.value || showMore.value) return;
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  isHorizontal = null;
}

function onTouchMove(e) {
  if (!e.touches || !e.touches[0]) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (isHorizontal === null) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    isHorizontal = Math.abs(dx) > Math.abs(dy);
  }
  if (!isHorizontal) return; // 垂直滚动：不拦截，交给歌词页自身滚动
  e.preventDefault(); // 水平滑动：阻止浏览器手势
  dragging.value = true;
  rawDx = dx; // 记录原始位移，供松手时判断是否切换
  // 歌曲页只允许向左滑（到歌词页）；歌词页只允许向右滑（回歌曲页）
  // 显示偏移钳制 ±45，松手判断用原始位移
  let offset = dx;
  if (page.value === 0) offset = Math.max(dx, -45);
  else offset = Math.min(dx, 45);
  dragX.value = offset;
}

function onTouchEnd() {
  isHorizontal = null;
  if (!dragging.value) return;
  dragging.value = false;
  if (page.value === 0 && rawDx < -60) page.value = 1;
  else if (page.value === 1 && rawDx > 60) page.value = 0;
  dragX.value = 0;
}

// 鼠标拖拽（桌面调试用）
let mouseTracking = false;
function onMouseStart(e) {
  if (showPlaylist.value || showMore.value || mouseTracking) return;
  mouseTracking = true;
  mouseDownX = e.clientX;
  mouseDownY = e.clientY;
  const onMouseMove = (ev) => {
    const dx = ev.clientX - mouseDownX;
    const dy = ev.clientY - mouseDownY;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    ev.preventDefault();
    dragging.value = true;
    rawMouseDx = dx;
    let offset = dx;
    if (page.value === 0) offset = Math.max(dx, -45);
    else offset = Math.min(dx, 45);
    dragX.value = offset;
  };
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    mouseTracking = false;
    isHorizontal = null;
    if (!dragging.value) return;
    dragging.value = false;
    if (page.value === 0 && rawMouseDx < -60) page.value = 1;
    else if (page.value === 1 && rawMouseDx > 60) page.value = 0;
    dragX.value = 0;
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function playAt(i) {
  showPlaylist.value = false;
  currentIndex.value = i;
}

function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
}

function formatTime(s) {
  if (!s || isNaN(s)) return '00:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1).replace(/\.0$/, '');
    return `${v}w+`;
  }
  if (n >= 1000) {
    const v = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `${v}k+`;
  }
  return `${n}+`;
}

const progressPercent = computed(() => {
  if (!duration.value) return 0;
  return Math.min(100, (currentTime.value / duration.value) * 100);
});

const metaLine = computed(() => {
  const s = currentSong.value;
  if (!s) return '';
  const parts = [];
  if (s.lyricist) parts.push(`词：${s.lyricist}`);
  if (s.composer) parts.push(`曲：${s.composer}`);
  if (s.arranger) parts.push(`编曲：${s.arranger}`);
  return parts.join(' / ');
});

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
      backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0) 62%, rgba(0, 0, 0, 0.65) 100%), url(${s.cover})`,
      backgroundSize: '100% auto',
    //   backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {
    background: `radial-gradient(ellipse at 30% 30%, ${palette[0]} 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, ${palette[1] || palette[0]} 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, ${palette[2] || palette[1] || palette[0]} 0%, transparent 60%), #0a0a0a`,
  };
});

let keyHandler = null;

onMounted(async () => {
  // 初始歌曲：加载歌词并自动播放（audio 此时已挂载）
  await loadLyrics(currentSong.value.lyrics);
  if (props.autoPlay && audioRef.value) {
    try { await audioRef.value.play(); } catch (e) { /* autoplay blocked */ }
  }
  // 原生监听 touchmove（passive:false），水平滑动才阻止默认
  if (rootRef.value) {
    rootRef.value.addEventListener('touchmove', onTouchMove, { passive: false });
  }
  keyHandler = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') { if (audioRef.value) audioRef.value.currentTime = Math.max(0, audioRef.value.currentTime - 5); }
    else if (e.code === 'ArrowRight') { if (audioRef.value) audioRef.value.currentTime = Math.min(duration.value || 0, audioRef.value.currentTime + 5); }
  };
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('resize', updateCloseBtnSize);
});

onBeforeUnmount(() => {
  if (rootRef.value) rootRef.value.removeEventListener('touchmove', onTouchMove);
  if (keyHandler) window.removeEventListener('keydown', keyHandler);
  window.removeEventListener('resize', updateCloseBtnSize);
  if (timerId) clearInterval(timerId);
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

/* 两条歌词轮播区（QQ 音乐风格：居中占上半部分主空间，点击进歌词页） */
.lyric-snippet {
  min-height: 0;
  position: relative; /* 供旧歌词绝对定位以脱离流，实现同屏交叉滚动 */
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  text-align: left;
  user-select: none;
  cursor: pointer;
}

/* 歌词轮播组：保持上下两行纵向排列 */
.lyric-group {
  display: flex;
  flex-direction: column;
}

/* 歌词切换：同屏交叉滚动（旧行上滑淡出的同时新行从下方滑入，无空窗卡顿） */
.lyric-up-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.lyric-up-enter-from {
  opacity: 0;
  transform: translateY(22px);
}

.lyric-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.lyric-up-leave-active {
  position: absolute;
  top: 16px;
  left: 24px;
  right: 24px;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.lyric-up-leave-to {
  opacity: 0;
  transform: translateY(-22px);
}

/* 歌曲信息（QQ 音乐风格：底部半透明白字叠加在封面背景上） */
.song-info {
  flex-shrink: 0;
  padding: 4px 24px 12px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.song-title {
  font-size: 72lpx;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
  color: #fff;
  text-shadow: 0 2lpx 12lpx rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.social {
  display: none;
  /* display: flex; */
  gap: 12px;
  flex-shrink: 0;
}

.social-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 9px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.social-item:hover { background: rgba(255, 255, 255, 0.15); }
.social-item.liked { color: #ff5e5e; }

.artist {
  margin: 12lpx 0 9lpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 49lpx;
  text-align: left;
  text-shadow: 0 1lpx 6lpx rgba(0, 0, 0, 0.6);
}

.meta {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 27lpx;
  text-shadow: 0 1lpx 6lpx rgba(0, 0, 0, 0.6);
}

.cur-line {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  margin: 0 0 8px;
  word-break: normal;
  overflow-wrap: break-word;
}

.next-line {
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  word-break: normal;
  overflow-wrap: break-word;
}

/* 歌词页 */
.lyrics-page {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 底部播放器 */
.player-bottom {
  position: relative;
  z-index: 2;
  padding: 12px 24px 28px;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: center;
}

.progress {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.progress-bar {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-dot {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress:hover .progress-dot { opacity: 1; }

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ctrl-btn {
  position: relative;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.92);
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s, transform 0.1s;
}

.ctrl-btn:hover { background: rgba(255, 255, 255, 0.06); }
.ctrl-btn:active { transform: scale(0.95); }

.ctrl-btn.active { color: #1ed760; }

.ctrl-btn.play {
  background: rgba(255, 255, 255, 0.08);
  width: 64px;
  height: 64px;
}

.ctrl-btn.play:hover { background: rgba(255, 255, 255, 0.14); }
.ctrl-btn.play.playing { background: #1ed760; color: #fff; }

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #1ed760;
  color: #000;
  font-size: 9px;
  font-weight: 700;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 播放列表 */
.playlist-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.playlist-panel {
  width: 100%;
  height: 1000lpx;
  background: #582828;
  border-top-left-radius: 32lpx;
  border-top-right-radius: 32lpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -16lpx 49lpx rgba(0, 0, 0, 0.4);
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20lpx 49lpx;
  border-bottom: 2lpx solid rgba(255, 255, 255, 0.1);
}

.playlist-header h3 {
  margin: 0;
  font-size: 32lpx;
  font-weight: 600;
}

.playlist-header .count {
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  font-size: 27lpx;
  margin-left: 8lpx;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
  width: 49lpx;
  height: 49lpx;
  padding: 0;
}
.close-btn:hover { background: rgba(255, 255, 255, 0.1); }

/* 更多面板 */
.more-panel {
  background: linear-gradient(180deg, #2b2b30 0%, #1d1d22 100%);
  max-height: 70vh;
}

.more-body {
  padding: 16lpx 24lpx 32lpx;
  overflow-y: auto;
}

.more-section { margin-bottom: 24lpx; }

.more-section:last-child { margin-bottom: 0; }

.more-label {
  margin: 0 0 12lpx;
  font-size: 24lpx;
  color: rgba(255, 255, 255, 0.55);
}

.more-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12lpx;
}

.more-opt {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24lpx;
  padding: 10lpx 22lpx;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.more-opt:hover { background: rgba(255, 255, 255, 0.16); }

.more-opt.active {
  background: #1ed760;
  color: #000;
  font-weight: 600;
}

.timer-hint {
  margin: 10lpx 0 0;
  font-size: 22lpx;
  color: #1ed760;
}

.playlist {
  list-style: none;
  margin: 0;
  padding: 8lpx 0;
  overflow-y: auto;
  flex: 1;
}

.playlist li {
  display: flex;
  align-items: center;
  gap: 24lpx;
  padding: 20lpx 40lpx;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist li:hover { background: rgba(255, 255, 255, 0.05); }

.playlist li.active { color: #1ed760; }
.playlist li.active .pl-index { color: #1ed760; }

.pl-index {
  width: 49lpx;
  text-align: center;
  font-size: 27lpx;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.pl-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
}

.pl-title {
  font-size: 27lpx;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-divider {
    margin: 0 8lpx;
}

.pl-artist {
  margin: 0;
  font-size: 24lpx;
  opacity: .5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pl-duration {
  font-size: 24lpx;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.playlist-fade-enter-active, .playlist-fade-leave-active { transition: opacity 0.25s; }
.playlist-fade-enter-from, .playlist-fade-leave-to { opacity: 0; }

/* 底部播放器淡入淡出 */
.footer-fade-enter-active, .footer-fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.footer-fade-enter-from, .footer-fade-leave-to { opacity: 0; transform: translateY(12lpx); }

.playlist-slide-enter-active, .playlist-slide-leave-active { transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); }
.playlist-slide-enter-from, .playlist-slide-leave-to { transform: translateY(100%); }

@media (max-width: 480px) {
  /* .song-title { font-size: 22px; }
  .ctrl-btn.play { width: 60px; height: 60px; }
  .cur-line { font-size: 18px; } */
}
</style>
