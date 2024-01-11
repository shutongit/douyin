// SlideList的方法


/**
 * 页面渲染完成时初始化数据
 * @param {HTMLElement} el 视图
 * @param {Object} state 数据源
 */
export function slideInit (el, state) {
  state.wrapper.width = getCss(el, 'width')
  state.wrapper.height = getCss(el, 'height')
  state.wrapper.childrenLength = el.children.length
  const ds = getSlideDistance(state)
  setCss(el, 'transform', `translate3d(0px, ${ds}px), 0`)
}
/**
 * 开始点击到滚动视图
 * @param {Event} e 事件
 * @param {HTMLElement} el 视图
 * @param {Object} state 数据源
 */
export function slideTouchStart (e, el, state) {
  setCss(el, 'transition-duration', `0ms`)

  state.start.x = e?.type.includes('mouse') ? e.pageX : e.touches[0].pageX
  state.start.y = e?.type.includes('mouse') ? e.pageY : e.touches[0].pageY
  state.start.time = Date.now()
  state.next = false
}

/**
 * 正在滑动视图
 * @param {Event} e 滚动事件
 * @param {HTMLElement} el 视图
 * @param {Object} state 数据源
 * @param {Function} canNextCb 是否可以滚动到下一个的回调
 */
export function slideTouchMove (e, el, state, canNextCb) {

  // 计算滚动的距离
  state.move.x = (e?.type.includes('mouse') ? e.pageX : e.touches[0]?.pageX) - state?.start?.x
  state.move.y = (e?.type.includes('mouse') ? e.pageY : e.touches[0]?.pageY) - state?.start?.y
  //
  state.next = Math.abs(state.move.y) > 0

  // 如果距离小于0 就是下一个，如果大于0就是上一个
  let isNext = state.move.y < 0

  // 如果不能切换视图就返回
  if (!canNextCb?.(isNext)) return
  stopPropagation(e)

  let ds = getSlideDistance(state)
  ds += state.move.y

  setCss(el, 'transition-duration', `0ms`)
  setCss(el, 'transform', `translate3d(0px, ${ds}px, 0)`)
}

/**
 * 滑动结束
 * @param {Event} e 事件
 * @param {Object} state 数据源
 * @param {Function} canNextCb 是否可以切换下一个
 * @param {Function} nextCb 切换下一个的回调
 */
export function slideTouchEnd (e, state, canNextCb, nextCb) {
  let isNext = state.move.y < 0
  const can = !canNextCb?.(isNext)
  if (can) return
  if (state.next) {


    stopPropagation(e)

    let endTime = Date.now()

    // 时间间隔
    let gapTime = endTime - state.start.time

    let distance = state.move.y

    if (Math.abs(distance) < 20) {
      // 如果滚动的距离小于20 就重置时间间隔为1000ms
      gapTime = 1000
    }

    if (Math.abs(distance) > (state.wrapper.height / 3)) {
      // 如果滚动的距离大于视图高度的1/3 就重置时间间隔为100
      gapTime = 100
    }
    if (gapTime < 150) {
      // 如果时间间隔够快或者滚动距离够多 就切换页面
      if (isNext) {
        state.localIndex++
      } else {
        state.localIndex--
      }
      return nextCb?.(isNext)
    }
  }

}

/**
 * 滚动结束之后重置数据
 * @param {HTMLElement} el 视图
 * @param {Object} state 数据源
 * @param {EmitFn} emit 时间触发器
 */
export function slideReset (el, state, emit) {
  setCss(el, 'transition-duration', `300ms`)

  const t = getSlideDistance(state)
  let ds = t
  setCss(el, 'transform', `translate3d(0px, ${ds}px, 0)`)
  state.start.x = state.start.y = state.start.time = state.move.x = state.move.y = 0
  state.next = false

  emit?.('update:index', state.localIndex)
}

/**
 * 设置css样式
 * @param {HTMLElement} el 视图
 * @param {String} key css属性名
 * @param {any} value css属性值
 */
export function setCss (el, key, value) {
  if (key === 'transform') {
    el.style.webkitTransform =
      el.style.MsTransform =
      el.style.msTransform =
      el.style.OTransform =
      el.style.transform =
      value
  } else {
    el.style[key] = value
  }
}

/**
 * 获取属性值
 * @param {HTMLElement} curEle 视图
 * @param {String} attr 属性名
 * @returns 属性值
 */
export function getCss (curEle, attr) {
  let val = null, reg = null
  if ("getComputedStyle" in window) {
    val = window.getComputedStyle(curEle, null)[attr]
  } else {   //ie6~8不支持上面属性
    //不兼容
    if (attr === "opacity") {
      val = curEle.currentStyle["filter"]   //'alpha(opacity=12,345)'
      reg = /^alphaopacity=(\d+(?:\.\d+)?)opacity=(\d+(?:\.\d+)?)$/i
      val = reg.test(val) ? reg.exec(val)[1] / 100 : 1
    } else {
      val = curEle.currentStyle[attr]
    }
  }
  return parseFloat(val)
}

/**
 * 返回滚动视图的顶部距离
 * @param {Object} state 数据源
 * @returns Number
 */
export function getSlideDistance (state) {
  return -state.localIndex * state.wrapper.height

}

/**
 * 阻止冒泡和默认行为
 * @param {Event} e 事件
 */
export function stopPropagation (e) {
  e?.stopImmediatePropagation()
  e?.stopPropagation()
  e?.preventDefault()
}


/**
 * * 播放状态
 */
export const PlayStatus = {
  stop: "stop", // 暂停
  start: 'start', // 开始
  toggle: 'toggle', // 取反
}
