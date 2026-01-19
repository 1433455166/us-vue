<template>
    <div>
        <div class="card" :style="{ backgroundImage: `url(${bgImage || '../../public/images/novel/novel002.png'})` }" />
        <h3 class="card-title">{{ title }}</h3>
    </div>
</template>

<script setup>
defineProps({
  title: String,
  content: String,
  bgImage: String,
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 347lpx;
  height: 500lpx;
  padding: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background-size: 100%;
}

.card-title {
  margin: 0 0 0.8rem;
  color: #2c3e50;
  font-size: 1.2rem;
}

.card-content {
  color: #666;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

/* 响应式布局 */
@media (max-width: 767px) {
  .card {
    max-width: 100%;
    margin: 0;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .card {
    max-width: 40%;
  }
}

@media (min-width: 1024px) {
  .card {
    max-width: 22%;
  }
}
</style>