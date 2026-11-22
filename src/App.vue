<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="music">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <FloatingMusicWidget />
</template>

<script setup>
import FloatingMusicWidget from './views/music/components/FloatingMusicWidget.vue'
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background: #fff;
}
</style>