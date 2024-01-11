<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import playWhite from '@/assets/play-white.png'
import pauseWhite from '@/assets/pause-white.png'
import mutedIcon from '@/components/icon/muted-icon.vue'
// import fullIcon from '@/components/icon/full-icon.vue'
import ProgressBar from './ProgressBar.vue'
import { PlayStatus, stopPropagation } from '@/components/common'
import bus, { EVENT_KEY } from '@/utils/bus'
import { useMutedStore } from '@/store/index'

const props = defineProps({
  isPlay: {
    // 用于第一条数据
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => {}
  },
  position: {
    type: Object,
    default: () => {}
  }
})

const mutedStore = useMutedStore()
const state = reactive({
  start: { x: 0 }, // 开始拖拽
  last: { x: 0, time: 0 }, // 拖拽时的播放器进度所在位置
  paused: !props.isPlay, // 是否暂停
  step: 0, // 移动时的步长
  duration: 0, // 视频时长
  move: false, // 是否在移动进度条
  playX: 0, // 当前进度条的位置
  currentTime: 0 // 当前播放的时间
})

/**视频播放器 */
const videoRef = ref(null)
// 播放进度视图
const progressRef = ref(null)

/** 类名 */
const positionName = computed(() => {
  return 'item-' + Object.values(props.position).join('-')
})

/** 切换播放状态
 * @param {Number} index 下标
 * @param {PlayStatus} status 播放状态
 */
function toggleStatus({ index = 0, status }) {
  if (props.position?.index === index) {
    if (status == PlayStatus.toggle) {
      if (state.paused) {
        videoRef.value.play()
        state.paused = false
      } else {
        videoRef.value.pause()
        state.paused = true
      }
    } else if (status == PlayStatus.start) {
      videoRef.value.play()
      state.paused = false
      videoRef.value.currentTime = state.currentTime
    } else if (status == PlayStatus.stop) {
      videoRef.value.pause()
      state.paused = true
    }
    toggleMuted(mutedStore.getMuted)
  }
}
/**
 * 视图点击事件
 */
function handleClick(index, status) {
  toggleStatus({ index, status })
}
/**
 * 点击静音按钮
 */
function handleMuted() {
  mutedStore.setMuted(false)
  toggleMuted(false)
}
/** 取消静音 */
function toggleMuted(muted) {
  videoRef.value.muted = muted
  videoRef.value.volume = muted ? 0 : 1
}
/**
 * 进度条的类名
 */
const progressClassFunc = computed(() => {
  if (state.move) {
    return 'move'
  } else {
    return ''
  }
})

/**开始拖拽 */
function handleProgressStart(e) {
  state.start.x = e?.x
  state.last.x = state.playX
  state.last.time = state.currentTime
}
/**正在拖拽 */
function handleProgressMove(e) {
  stopPropagation()
  state.move = true
  toggleStatus({ index: props.index, status: PlayStatus.stop })
  const ds = e?.x - state.start.x
  state.playX = state.last.x + ds

  state.currentTime = state.last.time + Math.ceil(Math.ceil(ds) / state.step)
  if (state.currentTime <= 0) state.currentTime = 0
  if (state.currentTime >= state.duration) state.currentTime = state.duration
}
/**结束拖拽 */
function handleProgressEnd() {
  state.move = false
  stopPropagation()
  if (!state.paused) return
  videoRef.value.currentTime = state.currentTime
  toggleStatus({ index: props.index, status: PlayStatus.start })
}
/** 全屏 */
function handleFull() {
  console.log('全屏')
}
/** 视频资源准备完毕 */
function videoLoaded() {
  const video = videoRef.value
  state.duration = video?.duration || 0
  const width = progressRef?.value?.ref?.getBoundingClientRect()?.width || 0
  state.step = width / Math.floor(state.duration)

  video.addEventListener('timeupdate', (e) => {
    // 更新时间
    state.currentTime = Math.ceil(e?.target?.currentTime || 0)
    state.playX = (state.currentTime - 1) * state.step
  })
}
onMounted(() => {
  videoRef.value && videoRef.value.addEventListener('loadedmetadata', videoLoaded)
  // 响应播放变化
  bus.on(EVENT_KEY.click, toggleStatus)
  bus.on(EVENT_KEY.muted, (res) => {
    state.muted = res
  })
})
onUnmounted(() => {
  videoRef.value && videoRef.value.removeEventListener('loadedmetadata', videoLoaded)
})
</script>

<template>
  <div class="video-wrapper" :class="positionName" :page="item.id">
    <video
      ref="videoRef"
      :src="item.src"
      :autoplay="props.isPlay"
      preload="true"
      webkit-playsinline=""
      playsinline=""
      x-webkit-airplay=""
      x5-playsinline=""
      loop
      muted
    >
      <p>您的浏览器不支持 video 标签。</p>
    </video>
    <div class="mask" @click.stop="handleClick(props.position.index, PlayStatus.toggle)">
      <div class="status-img">
        <img v-if="state.paused" :src="playWhite" class="play" />
        <img v-else :src="pauseWhite" class="pause" />
      </div>
      <div class="tool" :class="progressClassFunc">
        <div v-if="mutedStore.getMuted" class="muted" @click.stop="handleMuted">
          <mutedIcon class="icon"></mutedIcon>
        </div>
        <div class="content">
          <div class="title">标题</div>
          <div class="des">详情</div>
        </div>
      </div>
      <div class="progress-bar">
        <ProgressBar
          ref="progressRef"
          :index="props.position.index"
          :step="state.step"
          :duration="state.duration"
          :current-time="state.currentTime"
          :play-x="state.playX"
          :move="state.move"
          @start="handleProgressStart"
          @move="handleProgressMove"
          @end="handleProgressEnd"
        ></ProgressBar>
        <!-- <div v-if="!state.move" class="full" @click.stop="handleFull">
          <fullIcon></fullIcon>
        </div> -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@tr: height 0.3s;
@p: 50px;
.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
video {
  width: 100%;
  height: 100%;
  transition:
    height,
    margin-top 0.3s;
  position: relative;
  z-index: 1;
}
// 视频上面的遮罩
.mask {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  z-index: 2;
  .status-img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .play,
    .pause {
      width: 100px;
      height: 100px;
    }
    .pause {
      animation: pauseAni 0.2s forwards;
    }
  }
  // 工具栏：静音按钮 标题 详情内容
  .tool {
    width: 100%;
    position: absolute;
    bottom: 0;
    .muted {
      width: 100%;
      height: 35px;
      .icon {
        background: #fff;
        border-radius: 50%;
        padding: 5px;
        position: absolute;
        right: 10px;
      }
    }
    .content {
      padding: 10px;
      background-color: #00000066;
      backdrop-filter: blur(1px);
      color: #fff;
      .title {
        font-weight: bold;
        margin-bottom: 10px;
      }
      .des {
        font-size: 14px;
      }
    }
  }
  & .tool.move {
    // transition: @tr;
    // height: 0;
    display: none;
  }

  .progress-bar {
    @gap: 2%;
    @w: calc(100% - @gap*4);

    z-index: 10;
    position: absolute;
    bottom: 0px;
    height: 30px;
    width: 100%;
    margin-bottom: 2px;
    .progress {
      width: @w;
      left: @gap*2;
    }
    // .full {
    //   position: absolute;
    //   width: 25px;
    //   right: @gap;
    //   svg {
    //     width: 100%;
    //     height: 100%;
    //     color: white;
    //   }
    // }
  }
}
@keyframes pauseAni {
  0% {
    opacity: 1;
    display: block;
  }
  100% {
    opacity: 0;
    display: none;
  }
}
</style>
