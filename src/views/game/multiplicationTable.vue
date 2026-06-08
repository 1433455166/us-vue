<template>
  <div class="game-wrapper">
    <div class="game-container">
      <!-- 开场动画 -->
      <div v-if="showIntro" class="intro-stage">
        <div class="animation-box">
          <div class="main-word" :key="introText.main">{{ introText.main }}</div>
          <div class="sub-word">{{ introText.sub }}</div>
          <div class="mode-tip-show">
            本局模式：{{ globalIsCorrectMode ? '✅ 正确九九乘法表' : '❌ 错位错误九九乘法表' }}
          </div>
          <div class="countdown-badge">{{ introCountdown }}</div>
        </div>
      </div>

      <!-- 游戏主界面 -->
      <div v-else class="game-main">
        <div class="top-bar">
          <div class="score">🎯 得分：{{ score }}</div>
          <div>
            <button class="pause-btn" @click="togglePause" :disabled="gameOver">
              {{ isPaused ? '▶️ 继续' : '⏸️ 暂停' }}
            </button>
            <button class="reset-btn" @click="resetGame">🔄 重置</button>
          </div>
        </div>

        <div class="mode-info">
          本局固定模式：{{ globalIsCorrectMode ? '✅ 正确九九表' : '❌ 错位错误九九表' }}
          <p class="mode-desc">{{ globalIsCorrectMode ? '填写完整正确答案即可得分' : '十位数字一致、个位数字不同才算答对' }}</p>
        </div>

        <div class="question-card">
          <div class="question-text">{{ question }}</div>
          <div class="timer" :class="{ warn: timeLeft <= 2 }">
            ⏱ 剩余：{{ timeLeft }} 秒
          </div>
        </div>

        <div class="input-group" :class="{ disabled: isPaused || gameOver }">
          <input
            v-model="userInput"
            @keyup.enter="checkAnswer"
            class="answer-input"
            placeholder="输入答案"
            ref="input"
            :disabled="isPaused || gameOver"
          />
          <button class="submit-btn" @click="checkAnswer" :disabled="isPaused || gameOver">
            确定
          </button>
        </div>

        <div class="result" :class="{ win: isCorrect }" v-html="resultText"></div>

        <!-- 暂停遮罩 -->
        <div v-if="isPaused" class="pause-mask">
          <div class="pause-text">游戏已暂停</div>
        </div>

        <!-- 游戏结束弹窗 -->
        <div v-if="gameOver" class="game-over-modal">
          <div class="modal-box">
            <h2>🎮 GAME OVER</h2>
            <p>最终得分：<b>{{ score }}</b></p>
            <p>答对题目数量：{{ correctCount }}</p>
            <button class="restart-btn" @click="resetGame">🔁 重新开局</button>
          </div>
        </div>
      </div>

      <footer>
        开局确定本局模式全程不变 | 失误或超时直接结束游戏
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showIntro: true,
      introStep: 0,
      introCountdown: 3,
      introTimer: null,

      globalIsCorrectMode: false,
      correctRate: 0.1,

      gameOver: false,
      isPaused: false,
      score: 0,
      correctCount: 0,

      question: '',
      realAnswer: 0,
      userInput: '',
      timeLeft: 5,
      gameTimer: null,
      canAnswer: true,

      resultText: '等待出题',
      isCorrect: false
    }
  },
  computed: {
    introText() {
      return [
        { main: '🧮 九九乘法挑战赛', sub: '本局模式提前揭晓' },
        { main: '⏱ 限时5秒快速作答', sub: '答错即刻结束' },
        { main: '🔥 准备开始挑战', sub: '牢记答题规则' }
      ][this.introStep]
    }
  },
  mounted() {
    this.startIntro()
  },
  beforeDestroy() {
    clearInterval(this.introTimer)
    clearInterval(this.gameTimer)
  },
  methods: {
    startIntro() {
      // 开局前就随机锁定本局模式，并展示出来
      this.globalIsCorrectMode = Math.random() < this.correctRate
      this.introTimer = setInterval(() => {
        if (this.introStep < 2) {
          this.introStep++
          this.introCountdown--
        } else {
          clearInterval(this.introTimer)
          this.showIntro = false
          this.initGame()
        }
      }, 1000)
    },

    initGame() {
      this.gameOver = false
      this.isPaused = false
      this.score = 0
      this.correctCount = 0
      this.nextQuestion()
    },

    nextQuestion() {
      if (this.gameOver) return
      clearInterval(this.gameTimer)
      this.canAnswer = true
      this.userInput = ''
      this.isCorrect = false
      this.resultText = '请快速输入答案'

      const a = Math.floor(Math.random() * 9) + 1
      const b = Math.floor(Math.random() * 9) + 1
      this.realAnswer = a * b
      this.question = `${a} × ${b} = ?`
      this.timeLeft = 5

      this.$nextTick(() => this.$refs.input?.focus())
      this.startTimer()
    },

    startTimer() {
      this.gameTimer = setInterval(() => {
        if (this.isPaused || this.gameOver) return
        this.timeLeft--
        if (this.timeLeft <= 0) {
          clearInterval(this.gameTimer)
          this.gameEnd('⏰ 答题超时，游戏结束')
        }
      }, 1000)
    },

    checkAnswer() {
      if (!this.canAnswer || this.isPaused || this.gameOver) return
      clearInterval(this.gameTimer)
      this.canAnswer = false

      const userNum = parseInt(this.userInput.trim())
      if (isNaN(userNum)) {
        this.gameEnd('❌ 输入无效，挑战终止')
        return
      }

      let win = false
      const real = this.realAnswer
      if (this.globalIsCorrectMode) {
        win = userNum === real
      } else {
        const realTen = Math.floor(real / 10)
        const realOne = real % 10
        const userTen = Math.floor(userNum / 10)
        const userOne = userNum % 10
        win = userTen === realTen && userOne !== realOne
      }

      if (win) {
        this.score += 10
        this.correctCount++
        this.isCorrect = true
        this.resultText = `✅ 作答正确！当前总分：${this.score}`
        setTimeout(() => this.nextQuestion(), 1200)
      } else {
        this.gameEnd('❌ 答案判定失败，游戏结束')
      }
    },

    gameEnd(msg) {
      this.gameOver = true
      this.isCorrect = false
      this.resultText = msg
    },

    togglePause() {
      this.isPaused = !this.isPaused
    },

    resetGame() {
      clearInterval(this.gameTimer)
      this.showIntro = true
      this.introStep = 0
      this.introCountdown = 3
    }
  }
}
</script>

<style scoped>
.game-wrapper {
  min-height: 100vh;
  background: linear-gradient(145deg, #1a5f7a, #0e3b4a);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial, sans-serif;
  padding: 10px;
}

.game-container {
  width: 100%;
  max-width: 500px;
  background: #fff8e1;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.intro-stage {
  padding: 40px 20px;
  text-align: center;
  background: #f9e7c2;
}
.animation-box {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.main-word {
  font-size: 32px;
  font-weight: bold;
  color: #d64045;
}
.sub-word {
  font-size: 18px;
  color: #2c5a2e;
}
.mode-tip-show {
  font-size: 20px;
  font-weight: bold;
  color: #c0392b;
  background: #fff;
  padding: 8px 16px;
  border-radius: 12px;
}
.countdown-badge {
  font-size: 24px;
  background: #2b3b42;
  color: #f9d56e;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

.game-main {
  padding: 25px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.score {
  background: #2a5f6e;
  color: #f9e0a0;
  padding: 8px 14px;
  border-radius: 20px;
  font-weight: bold;
}
.pause-btn, .reset-btn {
  padding: 8px 12px;
  margin-left: 6px;
  border: none;
  border-radius: 15px;
  font-weight: bold;
  cursor: pointer;
}
.pause-btn {
  background: #60a5fa;
  color: white;
}
.reset-btn {
  background: #daa06a;
  color: white;
}

.mode-info {
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
  color: #d03a50;
}
.mode-desc {
  font-size: 14px;
  color: #666;
  margin:4px 0;
}

.question-card {
  background: white;
  padding: 30px 20px;
  border-radius: 30px;
  text-align: center;
  margin-bottom: 25px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.question-text {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 15px;
}
.timer {
  font-size: 18px;
  font-weight: bold;
  padding: 6px 14px;
  background: #c3e0a7;
  border-radius: 15px;
  display: inline-block;
}
.timer.warn {
  background: #ff9a9a;
  color: #900;
}

.input-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.input-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.answer-input {
  width: 140px;
  font-size: 24px;
  text-align: center;
  padding: 10px;
  border: 3px solid #ffb347;
  border-radius: 15px;
  outline: none;
}
.submit-btn {
  padding: 10px 20px;
  font-size: 18px;
  border: none;
  border-radius: 15px;
  background: #ffbc6e;
  font-weight: bold;
  cursor: pointer;
}

.result {
  text-align: center;
  padding: 15px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 16px;
  background: #e6dcc8;
}
.result.win {
  background: gold;
}

.pause-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40px;
}
.pause-text {
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.game-over-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.modal-box {
  background: white;
  padding: 40px 30px;
  border-radius: 25px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.modal-box h2 {
  color: #e63946;
  margin-bottom: 20px;
}
.modal-box p {
  font-size: 18px;
  margin: 8px 0;
}
.restart-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: #ff9f1c;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

footer {
  text-align: center;
  padding: 10px;
  font-size: 12px;
  background: #f1e1be;
  color: #52412b;
}
</style>