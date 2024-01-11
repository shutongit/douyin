<script setup>
import { ref, computed } from 'vue'
import { stopPropagation } from '@/components/common'

const props = defineProps({
  index: {
    type: Number,
    default: 0
  },

  step: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  currentTime: {
    type: Number,
    default: 0
  },

  playX: {
    type: Number,
    default: 0
  },
  move: {
    type: Boolean,
    default: false
  }
})
const emits = defineEmits(['start', 'move', 'end'])

const progressRef = ref(null)
const drag = ref(false)
/**
 * 进度条的类名
 */
const progressClassFunc = computed(() => {
  if (props.move) {
    return 'move'
  } else {
    return ''
  }
})
/**
 * 开始拖拽
 * @param {Event} e
 */
function touchstart(e) {
  stopPropagation()

  const x = e?.type.includes('mouse') ? e.pageX : e.touches[0]?.pageX
  const y = e?.type.includes('mouse') ? e.pageY : e.touches[0]?.pageY
  emits('start', { x, y })
}
/**
 * 正在拖拽
 * @param {Event} e
 */
function touchmove(e) {
  stopPropagation()
  const x = e?.type.includes('mouse') ? e.pageX : e.touches[0]?.pageX
  const y = e?.type.includes('mouse') ? e.pageY : e.touches[0]?.pageY
  drag.value = Math.abs(x) > 0
  emits('move', { x, y })
}
/**
 * 拖拽结束
 * @param {Event} e
 */
function touchend() {
  stopPropagation()
  emits('end')
  drag.value = false
}

/**
 * 鼠标开始点击
 * @param {MouseEvent} e 鼠标点击事件
 */
function mousedown(e) {
  stopPropagation()
  progressRef.value.addEventListener('mousemove', mousemove)
  const x = e?.type.includes('mouse') ? e.pageX : e.touches[0]?.pageX
  const y = e?.type.includes('mouse') ? e.pageY : e.touches[0]?.pageY
  emits('start', { x, y })
}
/**
 * 鼠标在移动
 * @param {MouseEvent} e 鼠标点击事件
 */
function mousemove(e) {
  stopPropagation()
  const x = e?.type.includes('mouse') ? e.pageX : e.touches[0]?.pageX
  const y = e?.type.includes('mouse') ? e.pageY : e.touches[0]?.pageY
  drag.value = Math.abs(x) > 0

  emits('move', { x, y })
}
/**
 * 鼠标移动结束
 * @param {MouseEvent} e 鼠标点击事件
 */
function mouseup() {
  stopPropagation()
  // if (drag.value) {
  emits('end')
  // }
  progressRef.value.removeEventListener('mousemove', mousemove)
  drag.value = false
}
/** 格式化数字为时分秒 */
function formatterTimeStamp(v) {
  if (!v) return '00:00'
  let m = Math.floor(v / 60)
  let s = Math.round(v % 60)
  let str = ''
  if (m === 0) {
    str = '00'
  } else if (m > 0 && m < 10) {
    str = '0' + m
  } else {
    str = m
  }
  str += ':'
  if (s === 0) {
    str += '00'
  } else if (s > 0 && s < 10) {
    str += '0' + s
  } else {
    str += s
  }
  return str
}

defineExpose({
  ref: progressRef
})
</script>

<template>
  <div
    class="progress"
    :class="progressClassFunc"
    ref="progressRef"
    @click.stop="null"
    @touchstart="touchstart"
    @touchmove="touchmove"
    @touchend="touchend"
    @mousedown="mousedown"
    @mouseup="mouseup"
  >
    <div class="time" v-if="props.move">
      <span class="currentTime">{{ formatterTimeStamp(props.currentTime) }}</span>
      <span class="duration"> / {{ formatterTimeStamp(props.duration) }}</span>
    </div>
    <div class="bg"></div>
    <div class="progress-line" :style="{ width: props.playX + 'px' }"></div>
    <div class="point"></div>
  </div>
</template>

<style lang="less" scoped>
@w: 90%;
@h: 1px;
@radius: 10px;
@tr: height 0.3s;
@active-main-bg: rgb(31, 37, 52);

.progress {
  z-index: 10;
  position: absolute;
  bottom: -1px;
  height: 30px;
  // left: calc((100% - @w) / 2);
  // width: @w;
  width: 100%;
  display: flex;
  align-items: flex-end;
  margin-bottom: 2px;
  .time {
    position: absolute;
    z-index: 9;
    font-size: 24px;
    bottom: 50px;
    left: 0;
    right: 0;
    color: white;
    text-align: center;

    .duration {
      color: darkgray;
    }
  }

  .bg {
    transition: @tr;
    position: absolute;
    width: 100%;
    height: @h;
    background: rgba(#fff, 0.3);
    border-radius: @radius;
    z-index: 1;
  }
  .progress-line {
    transition: @tr;
    height: @h;
    width: 0;
    border-radius: @radius 0 0 @radius;
    background-color: rgba(#fff, 0.8);
    z-index: 2;
  }
  .point {
    transition: all 0.2s;
    width: @h + 2;
    height: @h + 2;
    border-radius: 50%;
    background-color: #ccc;
    transform: translate(-1px, 1px);
    z-index: 2;
  }
}

& .progress.move {
  @h: 10px;
  .bg {
    height: @h;
    background-color: @active-main-bg;
  }
  .progress-line {
    height: @h;
    background-color: #ffffff80;
  }
  .point {
    width: @h + 2;
    height: @h + 2;
    background-color: #fff;
    transform: translate(calc(-@h / 2), 1px);
  }
}
</style>
