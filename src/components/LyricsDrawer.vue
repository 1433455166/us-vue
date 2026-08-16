<template>
  <div class="lyrics-view">
    <!-- 歌曲头信息 -->
    <section class="lyrics-header">
      <div class="thumb-wrap">
        <img
          v-if="song.cover"
          class="lyrics-thumb"
          :src="song.cover"
          :alt="song.title"
          draggable="false"
        />
        <div v-else class="lyrics-thumb fallback">{{ song.title.charAt(0) }}</div>
      </div>
      <div class="header-text">
        <h2 class="title">{{ song.title }}</h2>
        <p class="sub">
          <span class="artist">{{ song.artist }}</span>
          <span v-if="song.album" class="album"> {{ song.album }} <span class="arrow">›</span></span>
        </p>
      </div>
    </section>

    <!-- 歌词滚动区 -->
    <section class="lyrics-body" ref="scrollRef" @scroll.passive="onScroll">
      <div class="lyrics-spacer-top"></div>
      <div class="lyrics-content">
        <p
          v-for="(line, idx) in lyrics"
          :key="idx"
          :class="['lyric-line', { active: idx === activeIndex, past: idx < activeIndex }]"
          :data-index="idx"
          @click="$emit('seek', line.time)"
        >
          {{ line.text || '　' }}
        </p>
        <p v-if="!lyrics.length" class="empty">暂无歌词</p>
      </div>
      <div class="lyrics-spacer-bottom"></div>
    </section>

    <!-- 底部渐变遮罩层（QQ 音乐风格渐晕） -->
    <div class="lyrics-mask"></div>

    <!-- 右下角播放按钮 -->
    <button
      class="floating-play"
      :class="{ playing: isPlaying }"
      @click="$emit('toggle-play')"
      aria-label="播放"
    >
      <SvgPlay v-if="!isPlaying" :size="iconSize" />
      <SvgPause v-else :size="iconSize" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import SvgPlay from './svgIcon/SvgPlay.vue';
import SvgPause from './svgIcon/SvgPause.vue';
import { getLengthPxByRatio } from '../utils/lpx';

const props = defineProps({
  song: { type: Object, required: true },
  lyrics: { type: Array, default: () => [] },
  currentTime: { type: Number, default: 0 },
  active: { type: Boolean, default: false },
  isPlaying: { type: Boolean, default: false },
});
const emit = defineEmits(['seek', 'toggle-play', 'update-current-index']);

const scrollRef = ref(null);
const activeIndex = ref(0);
let userScrolling = false;
let userScrollTimer = null;

// floating-play 图标尺寸：按 64lpx（设计稿基准）基于当前视口换算实际像素
const iconSize = ref(getLengthPxByRatio(1, 64));
function updateIconSize() {
  iconSize.value = getLengthPxByRatio(1, 64);
}
onMounted(() => window.addEventListener('resize', updateIconSize));
onBeforeUnmount(() => window.removeEventListener('resize', updateIconSize));

function updateActive() {
  const lines = props.lyrics;
  if (!lines.length) return;
  // 用户正在手动滚动歌词时不强制跳行/上报，避免抢走用户滑到的位置
  if (userScrolling) return;
  let lo = 0, hi = lines.length - 1, idx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= props.currentTime) { idx = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  if (idx !== activeIndex.value) {
    activeIndex.value = idx;
    // 仅歌词页可见时才滚动定位与上报；首页由 MusicPlayer 自行同步预览
    if (props.active) {
      emit('update-current-index', idx);
      scrollToActive();
    }
  }
}

function scrollToActive() {
  nextTick(() => {
    if (!scrollRef.value) return;
    const target = scrollRef.value.querySelector(`[data-index="${activeIndex.value}"]`);
    if (!target) return;
    const container = scrollRef.value;
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    const offset = (tRect.top - cRect.top) - cRect.height / 2 + tRect.height / 2;
    container.scrollBy({ top: offset, behavior: 'smooth' });
  });
}

function onScroll() {
  userScrolling = true;
  clearTimeout(userScrollTimer);
  userScrollTimer = setTimeout(() => { userScrolling = false; }, 2500);
}

// 切到歌词页时定位当前歌词
watch(() => props.active, (v) => {
  if (v) {
    userScrolling = false;
    updateActive();
    scrollToActive();
  }
});

watch(() => props.currentTime, updateActive);

watch(() => props.lyrics, () => {
  activeIndex.value = 0;
  if (props.active) scrollToActive();
});
</script>

<style scoped>
.lyrics-view {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

/* 歌曲头信息 */
.lyrics-header {
  padding: 2px 24px 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.lyrics-header .thumb-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
}

.lyrics-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  -webkit-user-drag: none;
}

.lyrics-thumb.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
}

.sub .arrow { margin-left: 2px; opacity: 0.8; }

/* 歌词滚动区 */
.lyrics-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  text-align: center;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.lyrics-body::-webkit-scrollbar { display: none; }

.lyrics-spacer-top, .lyrics-spacer-bottom { height: 28vh; min-height: 160px; }

.lyrics-content {
  padding: 0 28px 80px;
}

.lyric-line {
  margin: 14px 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color 0.3s, font-size 0.3s, transform 0.3s;
  font-weight: 400;
  word-break: normal;
  overflow-wrap: break-word;
}

.lyric-line:hover { color: rgba(255, 255, 255, 0.85); }

.lyric-line.active {
  color: #1ed760;
  font-size: 18px;
  font-weight: 600;
  transform: scale(1.02);
  text-shadow: 0 1px 6px rgba(30, 215, 96, 0.2);
}

.lyric-line.past { color: rgba(255, 255, 255, 0.4); }

.empty {
  color: rgba(255, 255, 255, 0.45);
  font-size: 15px;
  padding: 40px 0;
}

/* 底部渐变遮罩层（QQ 音乐风格渐晕） */
.lyrics-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 64%, rgba(0, 0, 0, 1) 100%);
}

/* 右下角播放按钮 */
.floating-play {
  position: absolute;
  right: 22px;
  bottom: 26px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
  color: #111;
  border: none;
  width: 81lpx;
  height: 81lpx;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s, background 0.2s;
}

.floating-play:hover { background: #fff; }
.floating-play:active { transform: scale(0.94); }

.floating-play.playing {
  background: #1ed760;
  color: #fff;
}
</style>