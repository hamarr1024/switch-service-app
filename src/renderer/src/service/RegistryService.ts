import {
  RegistryApplication,
  RegistryServiceInstance,
  RegistryType,
  ServiceGroup
} from '@share/ApplicationModels'
import { Application } from '@share/EurekaModels'
import { Response, TwowayChannel } from '@share/InnerCommunication'
import { ServiceMgtRequest, ServiceOperation } from '@share/ServiceManagementContract'
export class RegistryService {
  public async getAppInfos(group: ServiceGroup): Promise<RegistryApplication[]> {
    if (group.registry.type !== RegistryType.Eureka)
      return Promise.reject('不支持的RegistryType:' + group.registry.type)
    /**
     * 获取注册中心applications信息
     */
    try {
      const request = new ServiceMgtRequest(ServiceOperation.GetAppInfoList, group)
      let respData = (await window.api.invoke(
        TwowayChannel.ServiceManagement,
        request
      )) as Response
      // console.log(respData.data)
      let eurekaApps = respData['applications']['application'] as Application[]
      let appInfos = eurekaApps.map<RegistryApplication>((eurekaApp) => {
        let registryApp: RegistryApplication = {}
        registryApp.name = eurekaApp.name
        if (!eurekaApp.instance) {
          registryApp.instances = [] as RegistryServiceInstance[]
        } else {
          registryApp.instances = eurekaApp.instance.map<RegistryServiceInstance>((ins) => {
            return {
              id: ins.instanceId,
              appName: ins.app,
              status: ins.status,
              host: ins.hostName,
              port: ins.port.$
            }
          })
        }
        return registryApp
      })
      return Promise.resolve(appInfos)
    } catch (e) {
      return Promise.reject(e)
    }
  }
}
