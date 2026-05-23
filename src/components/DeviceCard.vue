<template>
  <div class="card" @click="handleClick">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content">{{ content }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  content: String
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  width: 100%;
  max-width: 320px;
  scroll-snap-align: start;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
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
/* 手机端 */
@media (max-width: 767px) {
  .card {
    max-width: 100%;
    margin: 0;
  }
}

/* 平板端 */
@media (min-width: 768px) and (max-width: 1023px) {
  .card {
    max-width: 40%;
  }
}

/* 大屏幕电脑 */
@media (min-width: 1024px) and (max-width: 1439px) {
  /* .card { max-width: 22%; } */
}

/* 超大屏幕 */
@media (min-width: 1440px) {
  /* .card { max-width: 18%; } */
}
</style>