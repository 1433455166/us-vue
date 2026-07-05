<template>
  <div class="music-list-container">
    <div class="list-header">
      <h2>音乐列表</h2>
      <p>共 {{ musicList.length }} 首歌曲</p>
    </div>
    
    <div class="music-list">
      <div 
        v-for="(song, index) in musicList" 
        :key="index" 
        class="music-item"
        @click="playSong(song)"
      >
        <div class="song-info">
          <h3 class="song-title">{{ song.title }}</h3>
          <p class="song-artist">{{ song.artist }}</p>
        </div>
        <div class="song-actions">
          <button class="play-btn" @click.stop="playSong(song)">▶️</button>
        </div>
      </div>
    </div>
    
    <div v-if="musicList.length === 0" class="empty-state">
      <p>暂无音乐文件</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  musicList: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['play-song'])

// 播放歌曲
const playSong = (song) => {
  emit('play-song', song)
}
</script>

<style scoped>
.music-list-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
}

.list-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.list-header h2 {
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.list-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.music-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: calc(100vh - 124px);
  overflow-y: auto;
}

.music-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.music-item:hover {
  background: #f0f4ff;
  transform: translateY(-2px);
  border-color: #667eea;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  color: #2c3e50;
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  color: #666;
  margin: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 10px;
  margin-left: 15px;
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .music-list-container {
    padding: 15px;
    margin: 0 10px;
  }
  
  .list-header h2 {
    font-size: 20px;
  }
  
  .song-title {
    font-size: 15px;
  }
  
  .song-artist {
    font-size: 13px;
  }
  
  .play-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>