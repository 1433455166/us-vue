<template>
  <div class="confirm-modal">
    <div class="modal-box">
      <h2>{{ title }}</h2>
      <p class="confirm-text">{{ text }}</p>
      <button class="confirm-btn" @click="$emit('confirm')">{{ confirmText }}</button>
      <button class="cancel-btn" @click="$emit('cancel')">{{ cancelText }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GomokuConfirmModal',
  props: {
    title: { type: String, default: '提示' },
    text: { type: String, default: '' },
    confirmText: { type: String, default: '✅ 确认' },
    cancelText: { type: String, default: '取消' }
  },
  emits: ['confirm', 'cancel']
}
</script>

<style scoped>
.confirm-modal {
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
  padding: 36px 30px;
  border-radius: 25px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 320px;
}
.modal-box h2 {
  color: #e63946;
  margin-bottom: 16px;
  font-size: 22px;
}
.confirm-text {
  font-size: 16px;
  color: #52412b;
  margin: 0 0 8px;
  line-height: 1.6;
}
.confirm-btn {
  margin: 12px 6px 0;
  padding: 12px 22px;
  background: #d64045;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
.cancel-btn {
  margin: 12px 6px 0;
  padding: 12px 22px;
  background: #2a5f6e;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
</style>
