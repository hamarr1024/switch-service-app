<template>
  <div class="root">
    <!-- <div class="topbar"> top bar</div> -->
    <Topbar class="topbar" :title="title" v-on:fold="handleFold" />
    <div class="dashboard" id="dashboard">
      <div class="left" :style="{ width: leftWidth }">
        <el-scrollbar>
          <ServiceGroupCard v-for="group in groups" :key="group._id!" :title="group.name" :groupId="group._id!"
            :isSelected="store.isSelected(group._id!)" />
        </el-scrollbar>
      </div>
      <div class="main">
        <el-empty description="Create a Service Group first!" v-if="!showSgd" style="height:100%;width: 100%;" />
         <Dashboard v-if="showSgd"/>
      </div>
    </div>

    <EditGroupDialog />
  </div>
</template>
<script setup lang="ts">
import ServiceGroupCard from '@renderer/components/ServiceGroupCard.vue'
import EditGroupDialog from '@renderer/components/EditGroupDialog.vue'
import Dashboard from '@renderer/components/Dashboard.vue'
import { useStore } from '@renderer/store/useStore'
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { OnewayChannel } from '@share/InnerCommunication'

const store = useStore()
const leftWidth = ref('0px')
const { groups } = storeToRefs(store)

const title = computed<string>(() => {
  const selectedGroupId = store.runtimeInfo.selectedGroupId
  if (!selectedGroupId || store.groups.length == 0) {
    return 'Switch Service'
  } else {
    return store.groups.find((g) => g._id === selectedGroupId)!.name
  }
})

const showSgd = computed(() => {
  return !!store.runtimeInfo.selectedGroupId
})


onBeforeMount(() => {
  store.loadAll().then(() => {
    // showSgd.value = true
    // refreshServiceGroupDashBoard()
    leftWidth.value = store.runtimeInfo.folded ? '0px' : '200px'
  })
})


const handleFold = () => {
  if (store.runtimeInfo.folded) {
    leftWidth.value = '200px'
    store.updateFolded(false)
  } else {
    leftWidth.value = '0px'
    store.updateFolded(true)
  }

}

onMounted(() => {
  window.api.subscribe('Home', OnewayChannel.SelectGroupByTray, (newGroupId) => {
    console.log('recieved group change by tray')
    store.loadAll().then(() => {
    // showSgd.value = true
    // refreshServiceGroupDashBoard()
    leftWidth.value = store.runtimeInfo.folded ? '0px' : '200px'
  })
  })
})
</script>

<style lang="scss" scoped>
$topbarHeight: 40px;
$leftWidth: 0px;
$borderColor: #c6c4c4be;

.root {
  width: 100vw;
  height: 100vh;
}

.topbar {
  // -webkit-app-region: drag;
  width: 100%;
  height: $topbarHeight;
  background: #ffffff;
  border-bottom: solid 1px $borderColor;
}

// .topbar > * {
//   -webkit-app-region: no-drag;
// }

.dashboard {
  width: 100%;
  height: calc(100% - $topbarHeight);
  background-color: #f4f3f2;
}

.left {
  float: left;
  height: 100%;
  background-color: #edebf1;
  // border: solid
  // transition: all 0.2s ease 0s;
}

.main {
  float: right;
  height: 100%;
  width: calc(100% - v-bind("leftWidth"));
  padding-left: 10px;
  // padding-top:10px;
  padding-right: 10px;
  background-color: #ffffff;
  border-left: solid 1px $borderColor;
  // transition: all 0.2s ease 0s;
}


</style>
