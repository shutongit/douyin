import { h } from 'vue'
import SVideoVue from '@/components/SVideo.vue'

/**
 * 根据数据类型来返回视图
 * @param {Object} item 对象数据
 * @param {Number} index 下标
 * @param {Boolean} play 是否播放
 * @param {Number} uniqueId 唯一id
 * @param {Boolean} muted 是否静音
 */
export function useSlideListItemRender (item, index, play, uniqueId) {

  let node
  if (item.type == 'img') {
    // 图片
  } else if (item.type === 'audio') {
    // 音频
  } else if (item.type === 'video') {
    node = h(SVideoVue, { isPlay: play, item: item, index: index, position: { uniqueId, index } })
  }

  return node
}
