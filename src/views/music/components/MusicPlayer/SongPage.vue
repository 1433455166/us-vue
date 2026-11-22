<template>
  <div class="song-info">
    <div class="title-row">
      <h1 class="song-title">{{ song.title }}</h1>
      <div class="social">
        <span class="social-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>{{ formatCount(commentCount) }}</span>
        </span>
        <span class="social-item" :class="{ liked }" @click.stop="toggleLike">
          <svg viewBox="0 0 24 24" width="16" height="16" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{{ formatCount(likeCount) }}</span>
        </span>
      </div>
    </div>
    <p class="artist">{{ song.artist }}</p>
    <p class="meta" v-if="metaLine">{{ metaLine }}</p>
  </div>

  <!-- 两条歌词轮播：当前 + 下一条，点击歌词本身进入歌词页（QQ 音乐风格：上半部分居中） -->
  <div class="lyric-snippet" v-if="hasLyrics" @click="$emit('open-lyrics')">
    <Transition name="lyric-up">
      <div class="lyric-group" :key="activeIndex">
        <p class="cur-line">{{ curLine }}</p>
        <p class="next-line">{{ nextLine }}</p>
      </div>
    </Transition>
  </div>
  <div class="lyric-snippet" v-else @click="$emit('open-lyrics')">
    <p class="cur-line">暂无歌词</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  song: { type: Object, required: true },
  activeIndex: { type: Number, default: 0 },
  curLine: { type: String, default: '' },
  nextLine: { type: String, default: '' },
  hasLyrics: { type: Boolean, default: false },
});

defineEmits(['open-lyrics']);

// 点赞/评论数（基于歌曲 id 生成的模拟数据）
const liked = ref(false);
const likeCount = ref(0);
const commentCount = ref(0);

function initSongData(song) {
  const seed = song.id * 1314;
  likeCount.value = 9000 + (seed % 5000);
  commentCount.value = 10000 + (seed % 8000);
  liked.value = false;
}

initSongData(props.song);
watch(() => props.song.id, () => initSongData(props.song));

function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
}

const metaLine = computed(() => {
  const s = props.song;
  if (!s) return '';
  const parts = [];
  if (s.lyricist) parts.push(`词：${s.lyricist}`);
  if (s.composer) parts.push(`曲：${s.composer}`);
  if (s.arranger) parts.push(`编曲：${s.arranger}`);
  return parts.join(' / ');
});

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
</script>

<style scoped>
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
</style>
