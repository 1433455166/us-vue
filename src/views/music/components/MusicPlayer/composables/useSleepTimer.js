import { ref, onBeforeUnmount } from 'vue'
import audio from '../../../../../utils/audioPlayer'

// 定时关闭播放（分钟数到点后自动暂停）
export function useSleepTimer() {
  const timerOptions = [0, 10, 20, 30, 60]
  const timerMinutes = ref(0)
  const remainingTime = ref(0)
  let timerId = null

  function setTimer(m) {
    timerMinutes.value = m;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (m > 0) {
      remainingTime.value = m * 60;
      timerId = setInterval(() => {
        remainingTime.value -= 1;
        if (remainingTime.value <= 0) {
          clearInterval(timerId);
          timerId = null;
          timerMinutes.value = 0;
          audio.pause();
        }
      }, 1000);
    }
  }

  onBeforeUnmount(() => {
    if (timerId) clearInterval(timerId);
  })

  return { timerOptions, timerMinutes, remainingTime, setTimer }
}
