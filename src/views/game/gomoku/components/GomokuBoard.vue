<template>
  <div class="board" @touchmove.prevent>
    <div class="grid-lines"></div>
    <div class="cells">
      <div
        v-for="cell in cells"
        :key="cell.index"
        class="cell"
        :class="{
          black: cell.value === 1,
          white: cell.value === 2,
          last: isLastMove(cell),
          win: isWinCell(cell),
        }"
        @click="$emit('pick', cell)"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GomokuBoard',
  props: {
    cells: { type: Array, required: true },
    lastMove: { type: Object, default: null },
    winCells: { type: Array, default: () => [] }
  },
  emits: ['pick'],
  methods: {
    isLastMove(cell) {
      return (
        !!this.lastMove &&
        cell.row === this.lastMove.row &&
        cell.col === this.lastMove.col
      )
    },
    isWinCell(cell) {
      return this.winCells.some(
        (p) => p.row === cell.row && p.col === cell.col
      )
    }
  }
}
</script>

<style scoped>
.board {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #f0c27f, #d9a75f);
  border-radius: 16px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
  touch-action: none;
}
.grid-lines {
  position: absolute;
  inset: calc(100% / 30);
}
.cells {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-template-rows: repeat(15, 1fr);
}
.cell {
  position: relative;
  cursor: pointer;
}
/* 网格线 */
.cell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-right: 1px solid rgba(90, 60, 30, 0.55);
  border-bottom: 1px solid rgba(90, 60, 30, 0.55);
}
.cell:nth-child(15n) {
  border-right: none;
}

/* 棋子 */
.cell::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 78%;
  height: 78%;
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  transition: transform 0.15s ease-out;
}
.cell.black::after {
  transform: translate(-50%, -50%) scale(1);
  background: radial-gradient(circle at 35% 30%, #5a5a5a, #111 60%);
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.5);
}
.cell.white::after {
  transform: translate(-50%, -50%) scale(1);
  background: radial-gradient(circle at 35% 30%, #ffffff, #d8d8d8 65%);
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.35);
}
/* 最后落子标记：棋子中心红点 */
.cell.last::before {
  border: none;
  inset: auto;
  left: 50%;
  top: 50%;
  width: 24%;
  height: 24%;
  transform: translate(-50%, -50%);
  background: #e63946;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
  z-index: 1;
}
/* 获胜连线标记 */
.cell.win::after {
  box-shadow: 0 0 0 3px #ffd166, 1px 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
