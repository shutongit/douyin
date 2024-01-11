<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, createVNode, render } from 'vue'
import $ from 'jquery'
import { useSlideListItemRender } from '@/utils/useSlideListItemRender.js'
import {
  slideInit,
  setCss,
  getSlideDistance,
  slideTouchStart,
  slideTouchMove,
  slideTouchEnd,
  slideReset,
  PlayStatus
} from '@/components/common'
import { throttle } from 'loadsh'
import bus, { EVENT_KEY } from '@/utils/bus'
import SlideItem from '@/components/SlideItem.vue'

const props = defineProps({
  index: {
    // 下标
    type: Number,
    default: 0
  },

  list: {
    // 数据源
    type: Array,
    default: () => []
  },
  virtualCount: {
    // 渲染的dom数量
    type: Number,
    default: () => 5
  },
  noMore: {
    // 没有更多数据了
    type: Boolean,
    default: () => false
  }
})

const emit = defineEmits(['update:index', 'loadMore'])

const itemClassName = 'slide-item' // 类名

const state = reactive({
  wrapper: {
    // 视图的宽高和子视图数量
    width: 0,
    height: 0,
    childrenLength: 0
  },
  localIndex: props.index, // 当前下标
  start: { x: 0, y: 0, time: 0 },
  move: { x: 0, y: 0 }
})

const appInsMap = new Map() // 添加的视图的map
/** 滚动列表视图 */
const wrapperRef = ref(null)

watch(
  () => props.list,
  (newVal, oldVal) => {
    if (state.wrapper.childrenLength == 0 && newVal.length) {
      // 第一次进入
      insertContent()
    } else if (state.wrapper.childrenLength != 0 && state.wrapper.childrenLength < newVal.length) {
      // 添加数据
      let end = oldVal.length + 3
      if (end >= newVal.length) end = newVal.length
      const top = $(wrapperRef.value).find(`.${itemClassName}:last`).css('top')
      newVal.slice(oldVal.length, end).map((item, index) => {
        const el = getInsEl(item, oldVal.length + index)
        $(el).css('top', top)
        wrapperRef.value.appendChild(el)
        state.wrapper.childrenLength++
      })
    }
  },
  {
    deep: true
  }
)

watch(
  () => props.index,
  (newVal, oldVal) => {
    if (!props.list.length) return
    const newEl = $(wrapperRef.value).find(`.${itemClassName}[data-index=${newVal}]`)
    newEl && newEl.addClass('active')
    const oldEl = $(wrapperRef.value).find(`.${itemClassName}[data-index=${oldVal}]`)
    oldEl && oldEl.removeClass('active')

    bus.emit(EVENT_KEY.click, { index: newVal, status: PlayStatus.start })
    setTimeout(() => {
      bus.emit(EVENT_KEY.click, { index: oldVal, status: PlayStatus.stop })
    }, 300)
  }
)

/**
 * 开始点击
 * @param {Event} e 事件
 */
function touchstart(e) {
  slideTouchStart(e, wrapperRef.value, state)
}

/**
 * 滚动
 * @param {Event} e 事件
 */
function touchmove(e) {
  slideTouchMove(e, wrapperRef.value, state, canNext)
}

/**
 * 滚动结束
 * @param {Event} e 事件
 */
function touchend(e) {
  slideTouchEnd(e, state, canNext, turnPage)
  slideReset(wrapperRef.value, state, emit)
}

/**
 * 向上
 * @param {KeyboardEvent} e 键盘事件
 */
function keyup(e) {
  if (e && e?.key == 'ArrowUp') {
    if (state.localIndex > 0) {
      scrollUp.value()
    }
  }
}
const scrollUp = ref(
  throttle(function () {
    state.localIndex--
    turnPage()
    slideReset(wrapperRef.value, state, emit)
  }, 500)
)

/**
 * 向下
 * @param {KeyboardEvent} e 键盘事件
 */
function keydown(e) {
  if (e && e?.key == 'ArrowDown') {
    scrollDown.value()
  }
}
const scrollDown = ref(
  throttle(function () {
    state.localIndex++
    turnPage(true)
    slideReset(wrapperRef.value, state, emit)
  }, 500)
)

/**
 * 鼠标开始点击
 * @param {MouseEvent} e 鼠标点击事件
 */
function mousedown(e) {
  slideTouchStart(e, wrapperRef.value, state)
  wrapperRef.value.addEventListener('mousemove', mousemove)
}
/**
 * 鼠标在移动
 * @param {MouseEvent} e 鼠标点击事件
 */
function mousemove(e) {
  slideTouchMove(e, wrapperRef.value, state, canNext)
}
/**
 * 鼠标移动结束
 * @param {MouseEvent} e 鼠标点击事件
 */
function mouseup(e) {
  slideTouchEnd(e, state, canNext, turnPage)
  slideReset(wrapperRef.value, state, emit)
  wrapperRef.value.removeEventListener('mousemove', mousemove)
}
/**
 * 翻页
 * @param {Boolean} isNext 是否下一页
 */
// TODO: feat 数据源设置为3个 ， 渲染dom设置为5个，向下翻页会出现空视图
// TODO: fix 加载下一页的时候会出现跳过下标的情况
function turnPage(isNext) {
  // 切换页面
  const half = Math.floor(props.virtualCount / 2)

  if (props.list.length > props.virtualCount) {
    // 数据源数量大于要渲染的dom数量
    if (isNext) {
      // 下一页
      // 可以进行页面切换
      if (state.localIndex > props.list.length - props.virtualCount && state.localIndex >= half) {
        // 当前下标大于数据源和渲染dom数量的差 并且 当前下标大于渲染dom数量的一半
        // TODO: 加载更多
        if (props.noMore) {
          console.log('暂无更多数据')
        } else {
          emit('loadMore', true)
        }
      }

      const addItemIndex = state.localIndex + 2
      const res = $(wrapperRef.value).find(`.${itemClassName}[data-index=${addItemIndex}]`)
      if (
        state.wrapper.childrenLength < props.virtualCount &&
        props.list.length >= props.virtualCount
      ) {
        // 如果滚动视图的子视图数量小于要渲染的dom数量
        if (res.length === 0) {
          // 并且么有查找到对应的子视图；就做添加dom操作
          wrapperRef.value.appendChild(getInsEl(props.list[addItemIndex], addItemIndex))
        }
      }

      if (
        state.wrapper.childrenLength === props.virtualCount &&
        state.localIndex >= half &&
        state.localIndex <= props.list.length - 3
      ) {
        // 如果子视图数量等于要渲染的dom数量 并且 当前下标大于渲染dom数量的一半 并且 当前下标小于等于数据源数量-3
        // 添加新视图，移除旧视图
        if (res.length === 0) {
          console.log('翻页到下面的时候 要添加新的页面 移除最前面的视图')
          wrapperRef.value.appendChild(getInsEl(props.list[addItemIndex], addItemIndex))
          // 移除最前面的视图

          appInsMap.get($(wrapperRef.value).find(`.${itemClassName}:first`).data('index'))?.remove()

          $(wrapperRef.value)
            .find(`.${itemClassName}`)
            .each(function (_, v) {
              $(v).css('top', (state.localIndex - 2) * state.wrapper.height)
            })
        }
      }
      if (state.wrapper.childrenLength > props.virtualCount) {
        $(wrapperRef.value)
          .find(`.${itemClassName}`)
          .each((_, v) => {
            const index = $(v).data('index')
            if (index < state.localIndex - 2) {
              appInsMap.get(index)?.remove()
            }
            $(v).css('top', (state.localIndex - 2) * state.wrapper.height)
          })
      }
    } else {
      // 上一页
      const addItemIndex = state.localIndex - 2
      const res = $(wrapperRef.value).find(`.${itemClassName}[data-index=${addItemIndex}]`)
      if (state.localIndex > 1 && state.localIndex <= props.list.length - 4) {
        if (res.length === 0) {
          wrapperRef.value.prepend(getInsEl(props.list[addItemIndex], addItemIndex))

          appInsMap.get($(wrapperRef.value).find(`.${itemClassName}:last`).data('index'))?.remove

          $(wrapperRef.value)
            .find(`.${itemClassName}`)
            .each((_, v) => {
              $(v).css('top', (state.localIndex - 2) * state.wrapper.height)
            })
        }
      }
      if (state.wrapper.childrenLength > props.virtualCount) {
        appInsMap.get($(wrapperRef.value).find(`.${itemClassName}:last`).data('index'))?.remove()
      }
    }
    state.wrapper.childrenLength = wrapperRef.value.children.length
  }
}
/**
 * 插入视图
 * @param {Array} list 数据数组
 */
function insertContent(list = props.list) {
  if (!list?.length) return
  // 1. 清空当前页面
  $(wrapperRef.value).empty()

  // 2. 获取渲染dom的数量的一半
  const half = Math.floor(props.virtualCount / 2)

  // 局部的起始下标
  let start = 0

  if (state.localIndex >= half) {
    // 如果当前下标大于或者等于dom数量的一半
    start = state.localIndex - half
  }

  // 局部的末尾下标
  let end = start + props.virtualCount
  if (end >= list.length) {
    // 如果末尾的下标大于或等于数组的下标
    end = list.length
    start = end - props.virtualCount
  }
  start < 0 && (start = 0)
  // 根据起始位置和末尾位置 获取要渲染的数据
  list.slice(start, end).map((item, index) => {
    const el = getInsEl(item, index, index === state.localIndex)
    if (state.localIndex == 0 && index == 0) $(el).addClass('active')
    el && wrapperRef.value.appendChild(el)
  })

  // 设置视图滚动的位置
  setCss(wrapperRef.value, 'transform', `translate3d(0px, ${getSlideDistance(state)}px), 0px`)

  state.wrapper.childrenLength = wrapperRef.value?.children?.length || 0
}

/**
 * 渲染视图
 * @param {Object} item 数据源
 * @param {Number} index 下标
 * @param {Boolean} play 是否播放
 */
function getInsEl(item, index, play = false) {
  const itemVNode = useSlideListItemRender(item, index, play, 'uniqueId-')
  const vnode = createVNode(SlideItem, { 'data-index': index }, () => itemVNode)
  const container = document.createElement('div')
  render(vnode, container)
  appInsMap.set(index, container.firstElementChild)
  return container.firstElementChild
}

/**
 * 是否可以切换视图
 * @param {Boolean} isNext
 */
function canNext(isNext) {
  return !(
    (state.localIndex === 0 && !isNext) ||
    (state.localIndex === props.list.length - 1 && isNext)
  )
}
onMounted(() => {
  slideInit(wrapperRef.value, state)
  insertContent()
  listenerKeyupOrDown()
})
onUnmounted(() => {
  removeListenerKeyupOrDown()
})
/**
 * 添加页面监听上下键
 */
function listenerKeyupOrDown() {
  document.addEventListener('keydown', keydown)
  document.addEventListener('keyup', keyup)
}
/**
 * 移除页面监听上下键
 */
function removeListenerKeyupOrDown() {
  document.removeEventListener('keydown', keydown)
  document.removeEventListener('keyup', keyup)
}
</script>

<template>
  <div class="slide slide-infinite">
    <div
      class="slide-list flex-direction-column"
      ref="wrapperRef"
      @touchstart="touchstart"
      @touchmove="touchmove"
      @touchend="touchend"
      @mousedown="mousedown"
      @mouseup="mouseup"
    >
      <slot> </slot>
      <!-- <div class="no-data" v-if="props.list.length == 0">暂无数据</div> -->
    </div>
  </div>
</template>

<style scoped>
.slide-infinite {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #000;
}
.slide .slide-list {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.no-data {
  color: #fff;
  width: 100%;
  height: 100%;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
