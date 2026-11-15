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
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.modal-box {
  background: rgba(255, 255, 255, 0.78);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  padding: 28px 26px;
  border-radius: 25px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}
.modal-box h2 {
  color: #e63946;
  margin-bottom: 12px;
  font-size: 22px;
}
.winner-text {
  font-size: 18px;
  font-weight: bold;
  color: #52412b;
  margin: 8px 0 16px;
}
.restart-btn {
  margin: 10px 6px 0;
  padding: 10px 18px;
  background: #ff9f1c;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
.home-btn {
  margin: 10px 6px 0;
  padding: 10px 18px;
  background: #2a5f6e;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
</style>
