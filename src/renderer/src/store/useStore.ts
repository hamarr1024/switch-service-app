import { bus, BusEvent } from '@renderer/eventbus/eventbus'
import ProxyServiceService from '@renderer/service/ProxyServiceService'
import ServiceGroupService from '@renderer/service/ServiceGroupService'
import UserRuntimeService from '@renderer/service/UserRuntimeService'
import { ProxyService, ServiceGroup, UserRuntime } from '@share/ApplicationModels'
import { TwowayChannel } from '@share/InnerCommunication'
import { ServiceMgtRequest, ServiceOperation } from '@share/ServiceManagementContract'
import { defineStore } from 'pinia'

const userRuntimeService = new UserRuntimeService()
const serviceGroupService = new ServiceGroupService()
const proxyServiceService = new ProxyServiceService()

export const useStore = defineStore('useStore', {
  state: () => {
    return {
      runtimeInfo: {} as UserRuntime,
      groups: [] as ServiceGroup[]
      // proxyServices: [] as ProxyService[]
    }
  },
  getters: {},
  actions: {
    loadAll() {
      return Promise.all([this.loadUserRuntime(), this.loadServiceGroups()])
      // .then(() => bus.emit(BusEvent.RefreshServiceGroupDashBoard))
    },
    async loadUserRuntime() {
      let doc = await userRuntimeService.loadUserRuntime()
      if (!doc) {
        doc = await userRuntimeService.insert(new UserRuntime('', false))
      }
      this.runtimeInfo = doc
      // console.log('runtimeInfo', this.runtimeInfo)
    },
    async loadServiceGroups() {
      let docs = await serviceGroupService.findAll()
      this.groups = docs || []
    },
    isSelected(groupId: string) {
      return this.runtimeInfo.selectedGroupId === groupId
    },
    // isSelected(groupId: string) {
    //   return this.runtimeInfo.selectedGroupId === groupId
    // },
    getGroup(groupId: string) {
      if (!groupId) return Promise.resolve(null)
      return serviceGroupService.findOne(groupId)
    },

    createGroup(group: ServiceGroup) {
      let newServiceGroup = new ServiceGroup(group.name, group.registry)
      serviceGroupService.insert(newServiceGroup).then((newGroup) => {
        this.groups.push(newGroup)
        // 更新userRuntime
        this.updateSelectedGroup(newGroup._id!)
      })
    },

    updateFolded(folded: boolean) {
      this.runtimeInfo.folded = folded
      userRuntimeService.updateOne({
        query: { _id: this.runtimeInfo._id! },
        update: { $set: { folded: folded } }
      })
    },
    updateGroup(group: ServiceGroup) {
      serviceGroupService
        .updateOne({
          query: { _id: group._id! },
          update: {
            $set: {
              name: group.name,
              registry: group.registry
            }
          }
        })
        .then((updatedGroup) => {
          if (updatedGroup) {
            const foundedGroup = this.groups.find((g) => g._id! == updatedGroup._id!)
            if (foundedGroup) {
              foundedGroup.name = updatedGroup.name
              foundedGroup.registry = updatedGroup.registry
            }
          }
        })
    },
    updateSelectedGroup(groupId: string) {
      // 为空，重置
      if (!groupId) {
        this.runtimeInfo.selectedGroupId = ''
        userRuntimeService.updateOne({
          query: { _id: this.runtimeInfo._id! },
          update: { $set: { selectedGroupId: '' } }
        })
        return
      }
      // 更新store和db
      this.runtimeInfo.selectedGroupId = groupId
      userRuntimeService.updateOne({
        query: { _id: this.runtimeInfo._id! },
        update: { $set: { selectedGroupId: groupId } }
      })
    },
    findServiceGroup(groupId: string): Promise<ServiceGroup> {
      return serviceGroupService.findOne(groupId)
    },
    deleteGroup(groupId: string) {
      // 1. 先删除db，
      serviceGroupService.deleteOne({ query: { _id: groupId } }).then((rows) => {
        // 2. 再删除store
        // const groupToDelete = this.groups.find(g => g._id! === groupId)
        this.groups = this.groups.filter((g) => g._id! !== groupId)
        // 3. 选择第一个groupId
        if (this.groups.length > 0) {
          this.updateSelectedGroup(this.groups[0]._id!)
        } else {
          // 4. 全都删完了更新selectedGroup
          this.updateSelectedGroup('')
        }
      })
    },
    // proxy service
    async createProxyService(proxyService: ProxyService, groupId: string): Promise<any> {
      let newService: ProxyService = Object.assign({}, proxyService)
      // 默认值
      newService.groupId = groupId
      newService.configKey = !newService.forwardConfigs ? '' : newService.forwardConfigs![0].key
      // insert db
      console.log('newService', newService)
      return proxyServiceService.insert(newService).then((newDoc) => {
        console.log(newDoc)
        // this.proxyServices.push(newDoc)
      })
    },
    async updateProxyService(proxyService: ProxyService, groupId: string): Promise<any> {
      let updateService: ProxyService = Object.assign({}, proxyService)
      const res = await proxyServiceService.updateOne({
        query: { _id: proxyService._id! },
        update: {
          $set: {
            serviceName: proxyService.serviceName,
            instanceId: proxyService.instanceId,
            host: proxyService.host,
            port: proxyService.port,
            forwardConfigs: proxyService.forwardConfigs,
            configKey: proxyService.configKey
          }
        }
      })
      return await window.api.invoke(TwowayChannel.ServiceManagement, {
        op: ServiceOperation.ReloadServiceInfo,
        serviceId: proxyService._id!
      } as ServiceMgtRequest)
    },
    findProxyServices(groupId: string): Promise<ProxyService[]> {
      return proxyServiceService.findMany({
        query: { groupId: groupId },
        sort: { createTime: -1 }
      })
    }
  }
})
