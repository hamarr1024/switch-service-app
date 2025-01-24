<template>
  <div :class="clazz" 
        v-on:mouseover="onMouseEnter" 
        v-on:mouseout="onMouseLeave"
        v-on:click="onClick">
    <div class="svc_group_title" >{{ title }}</div>
    <div class="svc_group_action items-center" v-show="hovered && isSelected">
      <el-button-group>
        <el-button
          :icon="Edit"
          text
          style="width: 10px; height: 40px; border-radius: 0px"
          @click="editGroup()"
        />
        <el-button
          :icon="Delete"
          text
          style="width: 10px; height: 40px; border-radius: 0px"
          @click="deleteGroup()"
        />
      </el-button-group>
    </div>
  </div>
  <el-dialog v-model="dialog.show" :title="dialog.title" width="500" :lock-scroll="false">
    <span>{{ dialog.message }}</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialog.show = false">取消</el-button>
        <el-button type="primary" @click="dialog.handleConfirm()"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Delete, Edit } from '@element-plus/icons-vue'
import { bus, BusEvent } from '@renderer/eventbus/eventbus'
import ProxyServiceService from '@renderer/service/ProxyServiceService'
import { useStore } from '@renderer/store/useStore'
import { NotifyUtils } from '@renderer/utils/NotifyUtils'
import { defineOptions, onMounted, ref, watch } from 'vue'

// defineEmits['sgc-selected']
defineOptions({
  inheritAttrs: false
})
const store = useStore()
const {
  title = 'Group2',
  isSelected = false,
  groupId
} = defineProps<{
  groupId: string
  title?: String
  isSelected?: Boolean
}>()
const proxyService = new ProxyServiceService()
const hovered = ref(false)
let clazz = ref('svc_group_card')

const dialog = ref({
  title: '',
  message: '',
  show: false,
  confirmCallback: (): Promise<any> => {
    return Promise.resolve()
  },
  handleConfirm() {
    this.confirmCallback()
      .then(() => {
        NotifyUtils.success('操作成功')
      })
      .catch((reason) => {
        NotifyUtils.error('操作失败, reaosn:' + reason)
      })
      .finally(() => {
        this.show = false
      })
  }
})
watch(
  () => isSelected,
  (newVal) => {
    if (newVal) {
      clazz.value = 'svc_group_card_selected'
    } else {
      clazz.value = 'svc_group_card'
    }
  }
)

onMounted(() => {
  clazz.value = isSelected ? 'svc_group_card_selected' : 'svc_group_card'
  if (isSelected) {
     bus.emit(BusEvent.RefreshServiceGroupDashBoard)
  }
})

// function
function onMouseEnter() {
  hovered.value = true
  if (!isSelected) {
    // console.log('mouseEnter')
    clazz.value = 'svc_group_card_hover'
  }
}

function onMouseLeave() {
  hovered.value = false
  if (!isSelected) {
    // console.log('mouseLeave')
    clazz.value = 'svc_group_card'
  }
}

function onClick() {
  store.updateSelectedGroup(groupId)
  bus.emit(BusEvent.RefreshServiceGroupDashBoard)
}

function deleteGroup() {
  if (!groupId) {
    console.log('groupId is null or undefined, skip')
    return
  }
  dialog.value.title = '删除服务组(' + title + ')?'
  dialog.value.message = '删除将终止所有代理服务并从注册中心剔除'
  dialog.value.confirmCallback = async () => {
    await proxyService.stopServicesByGroup(groupId)
      console.log('服务已终止')
      store.deleteGroup(groupId) 
  }
  dialog.value.show = true
}

function editGroup() {
  if (!groupId) {
    return
  }
  bus.emit(BusEvent.EditGroupDialog, groupId)
}



</script>

<style lang="scss">
.svc_group_card {
  width: 200px;
  height: 40px;
  display: table;
  // background-color: blue;
}
.svc_group_card_hover {
  width: 200px;
  height: 40px;
  display: table;
  background-color: #fff;
}

.svc_group_card_selected {
  width: 200px;
  height: 40px;
  display: table;
  background-color: #cbdef6;
}

// .svc_group_card_title {
//   width: 190px;
//   height: 40px;
//   line-height: 40px;
//   margin-left: 5px;
//   margin-top:2px;
//   padding-left: 20px;
//   vertical-align: middle;
//   font-size: 15px;
//   color: black;
//   border-radius: 5px;
// //   background-color: #ffffff;
// //   background-color: red;
// }

.svc_group_title {
  float: left;
  vertical-align: middle;
  height: 100%;
  line-height: 40px;
  font-size: 15px;
  color: black;
  border-radius: 5px;
  padding-left: 20px;
  overflow:hidden;//超出隐藏
  width: 120px;
  text-overflow:ellipsis;
  white-space: nowrap;
}

.svc_group_action {
  float: right;
  vertical-align: middle;
  align-items: center;
  height: 40px;
}
</style>
