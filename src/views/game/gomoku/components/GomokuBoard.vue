<template>
  <div class="board-wrap">
    <div class="coord-corner"></div>
    <div class="coord-cols">
      <span v-for="(label, i) in colLabels" :key="`c${i}`">{{ label }}</span>
    </div>
    <div class="coord-rows">
      <span v-for="(label, i) in rowLabels" :key="`r${i}`">{{ label }}</span>
    </div>

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
          :title="coordOf(cell)"
          @click="$emit('pick', cell)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { SIZE } from '../utils/gomoku.constants'

// 坐标标：列用大写字母 A-O，行用小写字母 a-o，左上角即 Aa
const COL_LABELS = Array.from({ length: SIZE }, (_, i) =>
  String.fromCodePoint(65 + i)
)
const ROW_LABELS = Array.from({ length: SIZE }, (_, i) =>
  String.fromCodePoint(97 + i)
)

export default {
  name: 'GomokuBoard',
  props: {
    cells: { type: Array, required: true },
    lastMove: { type: Object, default: null },
    winCells: { type: Array, default: () => [] }
  },
  emits: ['pick'],
  data() {
    return {
      colLabels: COL_LABELS,
      rowLabels: ROW_LABELS
    }
  },
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
    },
    // 单元格坐标，如左上角为 Aa
    coordOf(cell) {
      return `${COL_LABELS[cell.col]}${ROW_LABELS[cell.row]}`
    }
  }
}
</script>

<style scoped>
.board-wrap {
  display: grid;
  grid-template-columns: 1.15em 1fr;
  grid-template-rows: 1.15em 1fr;
  gap: 2px;
}
/* 坐标标 */
.coord-cols {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
}
.coord-rows {
  display: grid;
  grid-template-rows: repeat(15, 1fr);
}
.coord-cols span,
.coord-rows span {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(8px, 2.1vw, 11px);
  font-weight: bold;
  line-height: 1;
  color: rgba(90, 60, 30, 0.55);
  user-select: none;
}

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
.cell:nth-child(15n)::before {
  border-right: none;
}
/* 最下行不画下边框，避免超出棋盘圆角 */
.cell:nth-child(n + 211)::before {
  border-bottom: none;
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
/* 最后落子标记：棋子中心红点（保留网格线，用背景渐变画点） */
.cell.last::before {
  z-index: 1;
  background: radial-gradient(circle, #e63946 0 16%, transparent 17%);
}
/* 获胜连线标记 */
.cell.win::after {
  box-shadow: 0 0 0 3px #ffd166, 1px 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
