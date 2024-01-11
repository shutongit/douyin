

import mitt from 'mitt'

const emitter = mitt()
console.log('emitter: ', emitter)
export default emitter

export const EVENT_KEY = {
  click: 'sing_click', // 点击事件
  muted_cancel: 'muted',  // 是否静音
}