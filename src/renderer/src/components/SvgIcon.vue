<template>
  <svg class="iconClass" aria-hidden="true" :style="{width:size, height:size}" >
    <use :xlink:href="prefix + name" :fill="color" />
  </svg>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({
  //xlink:href属性值前缀
  prefix: {
    type: String,
    default: '#icon-'
  },
  //提供使用的图标名字
  name: String,
  //接受父组件传递颜色
  color: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: '100%'
  }
})

</script>
<style scoped>
.icon {
  /* v-bind是Vue3才支持的功能，可以将CSS的值与js的值绑定 */
  width: v-bind('props.size');
  height: v-bind('props.size');
  position: relative;
  /* vertical-align: -2px; */
  fill: currentColor;
}
</style>
