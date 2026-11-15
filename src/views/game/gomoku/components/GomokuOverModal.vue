<template>
  <div class="game-over-modal">
    <div class="modal-box">
      <h2>🎉 对局结束</h2>
      <p class="winner-text">{{ winnerText }}</p>
      <button class="restart-btn" @click="$emit('restart')">🔁 再来一局</button>
      <button class="home-btn" @click="$emit('home')">🏠 返回主页</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GomokuOverModal',
  props: {
    winnerText: { type: String, required: true }
  },
  emits: ['restart', 'home']
}
</script>

<style scoped>
.game-over-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.modal-box {
  background: white;
  padding: 40px 30px;
  border-radius: 25px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
.modal-box h2 {
  color: #e63946;
  margin-bottom: 20px;
}
.winner-text {
  font-size: 18px;
  margin: 8px 0 16px;
}
.restart-btn {
  margin: 10px 6px 0;
  padding: 12px 22px;
  background: #ff9f1c;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}
.home-btn {
  margin: 10px 6px 0;
  padding: 12px 22px;
  background: #2a5f6e;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}
</style>
