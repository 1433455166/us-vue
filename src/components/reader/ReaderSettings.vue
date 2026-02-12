<template>
  <div class="settings-overlay" @click="$emit('close')">
    <div class="settings-panel" @click.stop>
      <div class="panel-header">
        <h3>阅读设置</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="settings-content">
        <!-- 字体大小 -->
        <div class="setting-item">
          <label>字体大小</label>
          <div class="setting-controls">
            <button class="size-btn" @click="updateFontSize(-1)">A-</button>
            <span class="size-value">{{ settings.fontSize }}</span>
            <button class="size-btn" @click="updateFontSize(1)">A+</button>
          </div>
        </div>
        
        <!-- 行高 -->
        <div class="setting-item">
          <label>行间距</label>
          <div class="setting-controls">
            <input 
              type="range" 
              min="1.2" 
              max="3" 
              step="0.1"
              v-model.number="localSettings.lineHeight"
              @change="updateSettings"
            >
            <span class="value-display">{{ localSettings.lineHeight.toFixed(1) }}</span>
          </div>
        </div>
        
        <!-- 字体 -->
        <div class="setting-item">
          <label>字体</label>
          <select 
            v-model="localSettings.fontFamily"
            @change="updateSettings"
            class="font-select"
          >
            <option value="system-ui">系统字体</option>
            <option value="MaShanZheng">马山郑</option>
            <option value="LongCang">龙藏</option>
            <option value="NotoSerifSC-Medium">思源宋体 Medium</option>
          </select>
        </div>
        
        <!-- 主题 -->
        <div class="setting-item">
          <label>主题</label>
          <div class="theme-options">
            <button 
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: localSettings.theme === theme.id }"
              @click="selectTheme(theme.id)"
            >
              <div class="theme-preview" :style="{ background: theme.bg }"></div>
              <span>{{ theme.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  settings: Object
})

const emit = defineEmits(['update-settings', 'close'])

const localSettings = reactive({ ...props.settings })

const themes = [
  { id: 'light', name: '白天', bg: '#f8f5f0' },
  { id: 'dark', name: '夜间', bg: '#1a1a1a' },
  { id: 'sepia', name: '护眼', bg: '#f4ecd8' }
]

const updateFontSize = (delta) => {
  localSettings.fontSize = Math.max(12, Math.min(30, localSettings.fontSize + delta))
  updateSettings()
}

const selectTheme = (themeId) => {
  localSettings.theme = themeId
  updateSettings()
}

const updateSettings = () => {
  emit('update-settings', { ...localSettings })
}

// 监听props变化
watch(() => props.settings, (newSettings) => {
    console.log('localSettings', JSON.parse(JSON.stringify(localSettings)), JSON.parse(JSON.stringify(newSettings)));
    
  Object.assign(localSettings, newSettings)
}, { deep: true })
</script>
<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.settings-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  animation: slideUp 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.settings-content {
  padding: 20px;
}

.setting-item {
  margin-bottom: 25px;
}

.setting-item label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.setting-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.size-btn {
  width: 81lpx;
  height: 81lpx;
  border-radius: 50%;
  border: 2lpx solid #e0e0e0;
  background: white;
  color: #333;
  font-size: 36lpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.size-value {
  min-width: 60px;
  text-align: center;
  font-size: 16px;
  color: #333;
}

input[type="range"] {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
}

.value-display {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.font-select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  outline: none;
}

.font-select:focus {
  border-color: #4a90e2;
}

.theme-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-option {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  color: #000;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option.active {
  border-color: #4a90e2;
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4a90e2;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@media (max-width: 480px) {
  .settings-panel {
    border-radius: 15px 15px 0 0;
  }
  
  .panel-header,
  .settings-content {
    padding: 15px;
  }
}
</style>
