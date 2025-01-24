<template>
  <el-row>
    <el-col :span="6">
      <div style="display: flex; justify-content: flex-start;">
        <el-input v-model="dashboardModel.searchText" placeholder="service name" :prefix-icon="Search" clearable
          size="default" />

      </div>
    </el-col>
    <!-- <el-col :span="6" /> -->

    <el-col :span="18">
      <div style="display: flex; justify-content: flex-end ">
        <el-button type="default" :icon="Refresh" @click="clickRefresh()" size="default"
          v-show="runtimeInfo.selectedGroupId">刷新</el-button>
      </div>
    </el-col>

  </el-row>
  <div style="height: 10px;"></div>
  <el-row />
  <!-- <el-divider /> -->
  <el-row class="sgd_registry_content" id="row_registry_content">
    <div  style="width: 100%; height: 100%;"  v-loading="registryLoading">
      <el-empty description="暂无服务"  v-if="!showRegistryService" :height="scrollerHeight"/>
      <el-scrollbar v-show="showRegistryService" id="scroll_registry" :height="scrollerHeight">
        <el-space wrap>
          <el-card v-for="app in registryAppInfosDisplay" :key="app.name" style="width: 500px" body-style="height:250px"
            shadow="hover">
            <template #header>
              <div class="card-header" style="padding-left: 5px; font-weight: bold;">
                <el-text type="primary" size="small">{{ app.name }}</el-text>
              </div>
            </template>
            <!--- registry service instances -->
            <el-table :data="app.instances" style="width: 100%" size="small" max-height="200">
              <el-table-column fixed prop="id" label="InstanceId" width="200" />
              <el-table-column prop="host" label="Host" width="100" />
              <el-table-column prop="port" label="Port" width="60" />
              <el-table-column prop="status" label="Status" align="center" width="60">
                <template #default="scope">
                  <el-icon v-show="showAlived(scope.row)"><svg-icon name="status" color="#32ba22" /></el-icon>
                  <el-icon v-show="!showAlived(scope.row)"><svg-icon name="status" color="#8a8a8a" /></el-icon>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-space>
      </el-scrollbar>

    </div>
  </el-row>
</template>

<script setup lang="ts">
import { Refresh, Search } from '@element-plus/icons-vue';
import { RegistryService } from '@renderer/service/RegistryService';
import { useStore } from '@renderer/store/useStore';
import { NotifyUtils } from '@renderer/utils/NotifyUtils';
import { RegistryApplication, RegistryServiceInstance } from '@share/ApplicationModels';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted } from 'vue';
import { computed, ref, toRaw, watch } from 'vue';


// 属性、事件
// const props = defineProps<{
//   groupId?: string
// }>()

// const options = [
//   {
//     value: 'off',
//     label: 'off'
//   },
//   {
//     value: '1',
//     label: '1m'
//   },
//   {
//     value: '2',
//     label: '2m'
//   },
//   {
//     value: '5',
//     label: '5m'
//   }
// ]

// 自定义的data和func
interface TimeoutWrapper {
  start: number
  timeout: number | undefined
}

const loadingMin = 500
const store = useStore()
const { runtimeInfo } = storeToRefs(store)
const dashboardModel = ref({
  searchText: '',
  registryAppInfos: [] as RegistryApplication[],
  registryRefreshOption: 'off',
})



const registryAppInfosDisplay = computed<RegistryApplication[]>(() => {
  const appInfos = dashboardModel.value.registryAppInfos
  const searchText = dashboardModel.value.searchText
  if (!appInfos) return []
  // 根据筛选词过滤
  if (!searchText || searchText.trim() === '') return appInfos
  return appInfos.filter((app) =>
    app.name?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
  )
})

const showRegistryService = computed<boolean>(() => {
  return (
    dashboardModel &&
    dashboardModel.value.registryAppInfos &&
    dashboardModel.value.registryAppInfos.length > 0
  )
})
const registryService = new RegistryService()
const registryLoading = ref(false)

const setRegistryServiceLoading = (): TimeoutWrapper | undefined => {
  if (registryLoading.value) return
  registryLoading.value = true
  return {
    start: new Date().getTime(),
    timeout: window.setTimeout(() => {
      registryLoading.value = false
    }, 1000)
  }
}


const showAlived = (row: RegistryServiceInstance) => {
  return row.status === 'UP'
}


const setRegisteryAppInfos = (appInfos: RegistryApplication[]) => {
  dashboardModel.value.registryAppInfos = appInfos
}


const clearRegistryServiceLoading = (timeout: TimeoutWrapper | undefined) => {
  if (!registryLoading.value) return
  if (timeout && timeout.timeout) {
    const duration = new Date().getTime() - timeout.start
    // console.log(duration + 'ms')
    if (duration >= loadingMin) {
      // console.log('提前取消registryLoading')
      registryLoading.value = false
      clearTimeout(timeout.timeout)
    }
  }
}

const refreshRegistryApplications = (groupId: string) => {
  if (!groupId) return
  let timeout = setRegistryServiceLoading()
  store.getGroup(groupId).then(group => {
    if (group) {
      registryService.getAppInfos(toRaw(group))
        .then(appInfos => {
          setRegisteryAppInfos(appInfos)
          // updateScrollerHeight()
        }).catch(e => {
          NotifyUtils.error('查询服务列表异常' + e)
          dashboardModel.value.registryAppInfos=[]
        }).finally(() => clearRegistryServiceLoading(timeout))
    }
  })
}

const clickRefresh = () => {
  if (runtimeInfo.value.selectedGroupId) {
    refreshRegistryApplications(runtimeInfo.value.selectedGroupId)
  }
}

const resetDashboard = () => {
  dashboardModel.value = {
    searchText: '',
    registryAppInfos: [] as RegistryApplication[],
    registryRefreshOption: 'off',
  }
}
// 动态计算scrollbar的高度
const scrollerHeight = ref(0)
// let contentElement = document.getElementById('row_registry_content')
const updateScrollerHeight = () => {
  let tabEle = document.getElementsByClassName('el-tabs__content')
  scrollerHeight.value = tabEle[0].clientHeight -50
}

// 生命周期
watch(() => runtimeInfo.value.selectedGroupId, (newVal, _) => {
  // console.log('newVal:', newVal)
  if (!newVal) return
  refreshRegistryApplications(newVal)
})

watch(() => store.groups, (newVal, oldVal) => {
  // 已经删除了最后一个
  if (newVal && newVal.length == 0 && oldVal && oldVal.length > 0) {
    resetDashboard()
  }
})


onMounted(() => {
  // console.log('mounted')
  const groupId = runtimeInfo.value.selectedGroupId
  if (groupId) {
    refreshRegistryApplications(groupId)
  }
  updateScrollerHeight()
  window.addEventListener('resize', updateScrollerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollerHeight)
})

</script>

<style>
.el-card__header {
  height: 30px;
  padding: 0px 0px 0px 0px;
  font-size: small;
}

.card-header {
  height: 100%;
  line-height: 30px;
  width: 100%;
}
</style>