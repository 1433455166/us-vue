<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content">{{ content }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  content: String
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  width: 100%;
  max-width: 320px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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