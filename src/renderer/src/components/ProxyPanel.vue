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
                <el-button type="default" :icon="Plus" @click="openEditProxyServiceDialog()"
                    v-show="runtimeInfo.selectedGroupId">添加</el-button>
            </div>
        </el-col>

    </el-row>

    <el-row class="sgd_services_content">
        <!-- <el-scrollbar style="height: 100%;"> -->
        <el-table :data="proxyServicesDisplay" v-loading="dashboardModel.proxyServiceLoading" style="width:100%"
            max-height="400" size="small">
            <el-table-column label="Status" fixed min-width="80" align="center">
                <template #default="scope">
                    <el-popover placement="top-start" :width="200" trigger="hover" :content="scope.row.errorMsg"
                        v-if="scope.row.status === 'DOWN' && scope.row.errorMsg != '' && scope.row.errorMsg != undefined">
                        <template #reference>
                            <el-icon>
                                <svg-icon name="warning" />
                            </el-icon>
                        </template>
                    </el-popover>
                    <el-icon class="is-loading" v-if="scope.row.status === 'LOADING'" size="12"
                        style="margin-left:15px">
                        <Loading />
                    </el-icon>
                    <el-icon size="12">
                        <svg-icon name="status-up" v-show="scope.row.status === 'UP'" />
                        <svg-icon name="status-down" v-show="scope.row.status === 'DOWN'" />
                    </el-icon>
                </template>

            </el-table-column>
            <el-table-column fixed label="Instance" min-width="200" fit>
                <template #default="scope">
                    <div style="display: flex; align-items: center">
                        <el-icon ><svg-icon name="microservice" size="20px"/></el-icon>
                        <el-link type="primary" :href="scope.row.statusPageUrl" target="_blank">
                            <span style="margin-left: 10px">{{ scope.row.instanceId }}</span>
                        </el-link>
                    </div>
                </template>
            </el-table-column>
            <!-- <el-table-column property="createTime" label="CreateTime" :formatter="DateUtils.formatDate"></el-table-column> -->
            <el-table-column property="serviceName" label="Service" width="150"></el-table-column>
            <!-- <el-table-column property="host" label="Host" width="100"></el-table-column> -->
            <el-table-column label="Forward to" width="150">
                <template #default="scope">
                    <el-select v-model="scope.row.configKey" placeholder="Select" size="small" style="width: 120px;"
                        @change="selectedOptionChange(scope.row)">
                        <el-option v-for="opt in scope.row.forwardConfigs" :key="opt.key" :label="opt.key"
                            :value="opt.key">
                            <el-space>

                                <el-tooltip class="box-item" effect="dark" :content="opt.baseUrl" placement="top">
                                    <el-text type="primary">{{ opt.key }}:</el-text>
                                </el-tooltip>
                                <el-text>{{ opt.baseUrl }}</el-text>
                            </el-space>
                        </el-option>
                        <template #footer>
                            <el-form width="200px">
                                <el-form-item size="small">
                                    <el-space>
                                        <el-input v-model="addOptionData.key" class="option-input" size="small"
                                            placeholder="key" style="width:60px" />
                                        <el-input v-model="addOptionData.baseUrl" class="option-input" size="small"
                                            placeholder="url" style="width:calc(100%-20px)" />
                                    </el-space>
                                </el-form-item>
                                <el-form-item size="small" label-width="40px">
                                    <el-button size="small" @click="cancelAddForwardOption()">cancel</el-button>
                                    <el-button type="primary" size="small" @click="addForwardOption(scope.row)">
                                        confirm
                                    </el-button>
                                </el-form-item>
                            </el-form>
                        </template>
                    </el-select>
                </template>
            </el-table-column>
            <el-table-column property="lastStartTimestamp" label="Last started" :formatter="AppUtils.getTimeElapsedTips"
                width="100px" />
            <el-table-column label="Operations" fixed="right" min-width="120">
                <template #default="scope">
                    <el-space>
                        <el-button @click="operateProxyService(scope.row)" circle size="small" text
                            :disabled="scope.row.status === 'LOADING'">
                            <el-icon class="is-loading" v-if="scope.row.status === 'LOADING'" size="14">
                                <Loading />
                            </el-icon>
                            <el-icon size="14" v-if="scope.row.status !== 'LOADING'">
                                <svg-icon name="start" v-if="scope.row.status === 'DOWN'" />
                                <svg-icon name="playing" v-if="scope.row.status === 'UP'" size="10px" />
                            </el-icon></el-button>

                        <!--
                  <el-switch v-model="scope.row.status" :active-value="ProxyServiceStatus.enable"
                  :inactive-value="ProxyServiceStatus.disable" inline-prompt active-text="Stop" inactive-text="Start" size="small" />
                -->
                        <el-button size="small" :icon="Edit" text :disabled="scope.row.status !== 'DOWN'"
                            @click="editProxyService(scope.row)"></el-button>
                        <el-button size="small" type="danger" :icon="Delete" text
                            :disabled="scope.row.status !== 'DOWN'" @click="deleteProxyService(scope.row)"></el-button>
                    </el-space>

                </template>
            </el-table-column>
        </el-table>
        <!-- </el-scrollbar> -->
    </el-row>

    <EditProxyServiceDialog :visible="proxyServiceDialogModel.visible" :serviceId="proxyServiceDialogModel.serviceId"
        :serviceData="proxyServiceDialogModel.serviceData" @cancel="onCancelProxyService"
        @confirm="onConfirmProxyService" />
</template>

<script lang="ts" setup>
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue';
import ProxyServiceService from '@renderer/service/ProxyServiceService';
import { useStore } from '@renderer/store/useStore';
import { NotifyUtils } from '@renderer/utils/NotifyUtils';
import { ProxyService, ProxyServiceInfo, ServiceGroup } from '@share/ApplicationModels';
import { OnewayChannel } from '@share/InnerCommunication';
import { StatusChangeInfo } from '@share/ServiceClientStatusChangeContracts';
import AppUtils from '@share/utils/AppUtils';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onMounted, ref, toRaw, watch } from 'vue';

interface TimeoutWrapper {
    start: number
    timeout: number | undefined
}
type ProxyServiceStatus = 'UP' | 'DOWN' | 'LOADING'


interface ProxyServiceRow extends ProxyService {
    status: ProxyServiceStatus
    errorMsg?: string
    lastStartTimestamp?: number
    statusPageUrl?: string
}

const autoTasks: number[] = []
const loadingMin = 50
const proxyServiceService = new ProxyServiceService()
const addOptionData = ref({
    key: '',
    baseUrl: ''
})
const store = useStore()
const { runtimeInfo } = storeToRefs(store)
const proxyServiceDialogModel = ref({
    visible: false,
    serviceId: '',
    serviceData: {} as ProxyService
})

const dashboardModel = ref({
    searchText: '',
    proxyServiceLoading: false,
    proxyServiceSearchText: '',
    proxyServices: [] as ProxyServiceRow[],
    
})
const proxyServicesDisplay = computed(() => {
    return dashboardModel.value.proxyServices.filter(ps => {
        return ps.instanceId.includes(dashboardModel.value.searchText)
    })
})
// functions

const resetDashboard = () => {
    dashboardModel.value = {
        searchText: '',
        proxyServiceLoading: false,
        proxyServiceSearchText: '',
        proxyServices: [] as ProxyServiceRow[],
    }
}
const mapProxyServiceStatus = (clientStatus: string): ProxyServiceStatus => {
    switch (clientStatus) {
        case ('running'): {
            return 'UP'
        }
        case 'exited':
        case 'new':
        case 'notCreated':
        case 'error': {
            return 'DOWN'
        }

        default: {
            return 'LOADING'
        }
    }
}

const openEditProxyServiceDialog = (group?: ServiceGroup) => {
    // 新增
    if (!group) {
        // console.log('新增打开dialog')
        proxyServiceDialogModel.value.visible = true
        proxyServiceDialogModel.value.serviceId = ''
    }
}

const resetProxyServiceModel = () => {
    proxyServiceDialogModel.value.visible = false
    proxyServiceDialogModel.value.serviceId = ''
    proxyServiceDialogModel.value.serviceData = {} as ProxyService
}

const onCancelProxyService = () => {
    resetProxyServiceModel()
}



/**
 * 
 * const formDataEmpty = {
 *  instanceId:'',
 *  serviceId: '', // 唯一标识，db id
 *  serviceName: '', // 服务名
 *  host: '127.0.0.1',
 *  port: 18000, // 实例实例
 *  forwardOptions: [] as ForwardOption[]
 * }
 * @param data 
 */
const onConfirmProxyService = (data) => {
    // console.log('confrim', data)
    resetProxyServiceModel()
    const { serviceId, serviceName, host, port, forwardOptions, configKey } = { ...data }
    const groupId = runtimeInfo.value.selectedGroupId
    store.getGroup(groupId).then(group => {
        if (group) {
            if (!serviceId) { // 新增
                store.createProxyService({
                    instanceId: AppUtils.getInstanceId(serviceName, host, port),
                    serviceName: serviceName,
                    host: host,
                    port: port,
                    forwardConfigs: forwardOptions,
                    registry: toRaw(group)
                }, groupId).then(() => loadProxyServices(groupId))
            } else { // 修改
                store.updateProxyService({
                    _id: serviceId,
                    instanceId: AppUtils.getInstanceId(serviceName, host, port),
                    serviceName: serviceName,
                    host: host,
                    port: port,
                    forwardConfigs: forwardOptions,
                    configKey: configKey,
                    registry: toRaw(group)
                }, groupId).then(() => loadProxyServices(groupId))
            }

        }
    })

}


const operateProxyService = (row: ProxyServiceRow) => {
    if (row.status === 'DOWN') {
        row.status = 'LOADING'
        proxyServiceService.startService(row._id!)
            .then(() => {
                    row.lastStartTimestamp = new Date().getTime()
                }
            ).catch(reason => {
                console.log(reason)
                NotifyUtils.error(reason)
                row.errorMsg = reason
                setTimeout(() => {
                    row.status = 'DOWN'
                }, 500)
            })
    }

    if (row.status === 'UP') {
        row.status = 'LOADING'
        proxyServiceService.stopService(row._id!)
            .then(() => {
                console.log('stop successfully')
                // row.status = 'DOWN'
            }, reason => {
                row.errorMsg = reason
            })
    }
}

const editProxyService = (row: ProxyServiceRow) => {
    proxyServiceDialogModel.value.visible = true
    proxyServiceDialogModel.value.serviceId = row._id!
    proxyServiceDialogModel.value.serviceData = toRaw(row as ProxyService)
}

const setProxyServiceLoading = (): TimeoutWrapper | undefined => {
    if (dashboardModel.value.proxyServiceLoading) return
    dashboardModel.value.proxyServiceLoading = true
    return {
        start: new Date().getTime(),
        timeout: window.setTimeout(() => {
            dashboardModel.value.proxyServiceLoading = false
        }, 1000)
    }
}

const clearProxyServiceLoading = (timeout: TimeoutWrapper | undefined) => {
    if (!dashboardModel.value.proxyServiceLoading) return
    if (timeout && timeout.timeout) {
        const duration = new Date().getTime() - timeout.start
        // console.log(duration + 'ms')
        if (duration >= loadingMin) {
            // console.log('提前取消ProxyServiceLoading')
            clearTimeout(timeout.timeout)
            dashboardModel.value.proxyServiceLoading = false
        }
    }
}

const loadProxyServices = (groupId: string) => {
    if (!groupId) return
    let timeout = setProxyServiceLoading()
    store.findProxyServices(groupId)
        .then(async services => {
            const rows = [] as ProxyServiceRow[]
            dashboardModel.value.proxyServices = rows
            for (let s of services) {
                let row = {} as ProxyServiceRow
                Object.assign(row, s)
                // 获取状态
                let info = await proxyServiceService.fetchServiceStatus(s._id!)
                row.status = mapProxyServiceStatus(info.status)
                row.lastStartTimestamp = info.lastStartTimestamp
                // console.log('info', info)
                row.errorMsg = info.errorMsg
                row.statusPageUrl = `http://${s.host}:${s.port}/ss/info`
                dashboardModel.value.proxyServices.push(row)
            }

            // console.log('loadProxyServices:', dashboardModel.value.proxyServices)
        }, (reason) => {
            NotifyUtils.error('加载ProxyServices失败:' + reason)
        }).finally(() => clearProxyServiceLoading(timeout))
}

const deleteProxyService = (row: ProxyServiceRow) => {
    // 调用service删除
    proxyServiceService.deleteService(row._id!).then(() => {
        // refresh
        loadProxyServices(runtimeInfo.value.selectedGroupId)
    })
}


const addForwardOption = (row: ProxyServiceRow) => {
    if (!addOptionData.value.key || !addOptionData.value.baseUrl) {
        NotifyUtils.error('key or url cannot be empty')
        return
    }
    if (row.forwardConfigs?.find(c => c.key === addOptionData.value.key)) {
        NotifyUtils.error('key duplicated!')
        return
    }
    // 页面更新
    row.forwardConfigs?.push({ key: addOptionData.value.key, baseUrl: addOptionData.value.baseUrl })
    // save to db
    proxyServiceService.updateService(row._id!, toRaw(row) as ProxyService)
        .finally(() => clearAddOptionData())
}

const cancelAddForwardOption = () => {
    clearAddOptionData()
}

const clearAddOptionData = () => {
    addOptionData.value.key = ''
    addOptionData.value.baseUrl = ''
}

const selectedOptionChange = (row: ProxyServiceRow) => {
    // 页面更新
    proxyServiceService.updateService(row._id!, toRaw(row) as ProxyService)
}

function startAutoTasks() {
    // 1. 定时刷新service状态
    // console.log('设置自动刷新任务')
    let autoRefreshServiceStatus = window.setInterval(() => {
        refreshProxyServiceInfo()
    }, 5000);

    autoTasks.push(autoRefreshServiceStatus)
}
function clearAutoTasks() {
    if (autoTasks && autoTasks.length > 0) {
        // console.log('移除自动刷新任务')
        autoTasks.forEach(tm => window.clearInterval(tm))
    }
}

const refreshProxyServiceInfo = () => {
    const services = dashboardModel.value.proxyServices
    if (!services || services.length == 0) return
    const serviceIds = services.map(s => s._id!)
    proxyServiceService.batchFetchServiceStatus(serviceIds)
        .then((infos) => {
            const infoMap = new Map<string, ProxyServiceInfo>(infos.map(info => [info.id, info]))
            services.forEach(s => {
                const info = infoMap.get(s._id!)
                if (info) {
                    s.status = mapProxyServiceStatus(info.status)
                    s.errorMsg = info.errorMsg
                    if (info.lastStartTimestamp) {
                        s.lastStartTimestamp = info.lastStartTimestamp + Math.random()
                    }
                }
            })
        })
}

const updateProxyServiceStatus = (changeInfo: StatusChangeInfo) => {
    console.log('statusChanged', changeInfo)
    const services = dashboardModel.value.proxyServices
    if (!services || services.length == 0) return
    const serviceRow = services.find(s => s._id! === changeInfo.serviceId)
    if (serviceRow) {
        let after = changeInfo.after
        if (after.status) {
            serviceRow.status = mapProxyServiceStatus(after.status)
        }
        if (serviceRow) {
            serviceRow.errorMsg = after.errorMsg
        }
    }

}

// 生命周期
watch(() => runtimeInfo.value.selectedGroupId, (newVal, _) => {
    // console.log('newVal:', newVal)
    if (!newVal) return
    loadProxyServices(newVal)
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
        loadProxyServices(groupId)
    }

    // 监听service client
    window.api.subscribe('ProxyPanel', OnewayChannel.ServiceClientStatusChange, (data) => {
        let changeInfo = data as StatusChangeInfo
        window.setTimeout(() => {
            updateProxyServiceStatus(changeInfo)
        }, 500)
    })

    window.api.subscribe('ProxyPanel', OnewayChannel.ServiceClientError, (data) => {
        // console.log('error', data)
        const message = `<span style='font-weight:bold;'>code: </span>${data['code']}<br/>
        <span style='font-weight:bold;'>msg: </span>${data['msg']}`
        NotifyUtils.warn(message, 'Error', true)

    })

    window.api.subscribe('ProxyPanel', OnewayChannel.SelectConfigByTray, (data) => {
        const {serviceId, configKey} = {...data}
        const service = dashboardModel.value.proxyServices.find(s => s._id === serviceId)
        if (service) {
            service.configKey = configKey
            // 页面更新
            proxyServiceService.updateService(serviceId, toRaw(service) as ProxyService)
        }
    })
    // 定时任务
    startAutoTasks()
})

onBeforeMount(() => {
    clearAutoTasks()
    window.api.unsubscribeAll(OnewayChannel.ServiceClientStatusChange)
    window.api.unsubscribeAll(OnewayChannel.ServiceClientError)
})
</script>
<style>
.sgd_services_content {
    width: 100%;
}
</style>