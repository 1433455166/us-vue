<template>
  <div class="card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-content" v-for="value in list">{{ value }}</p>
  </div>
</template>

<script setup>
import daily from "../data/daily.json";

const data = daily.list[0];

const title = data.title;
const list = data.data;

</script>

<style scoped>
.card {
  border-radius: 12px;
  padding: 24lpx;
  width: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-title {
  margin: 0 0 0.8rem;
  color: #e5dec5;
  font-size: 1.2rem;
}

.card-content {
  color: #b9e8e8;
  line-height: 1.6;
  margin: 0;
  font-size: 24lpx;
}
</style>