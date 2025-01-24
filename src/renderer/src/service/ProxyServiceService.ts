import { ProxyService, ProxyServiceInfo } from '@share/ApplicationModels'
import { Database } from '@share/DMLContract'
import { TwowayChannel } from '@share/InnerCommunication'
import { ServiceMgtRequest, ServiceOperation } from '@share/ServiceManagementContract'
import BaseService from './BaseService'
import { NotifyUtils } from '@renderer/utils/NotifyUtils'
import ServiceGroupService from './ServiceGroupService'

export default class ProxyServiceService extends BaseService<ProxyService> {
  private groupService = new ServiceGroupService()
  protected database(): Database {
    return Database.ProxyService
  }

  public startService(serviceId: string): Promise<string> {
    const req: ServiceMgtRequest = {
      op: ServiceOperation.StartProxyService,
      serviceId: serviceId
    }
    return window.api.invoke(TwowayChannel.ServiceManagement, req)
  }

  public stopService(serviceId: string): Promise<string> {
    const req: ServiceMgtRequest = {
      op: ServiceOperation.StopProxyService,
      serviceId: serviceId
    }
    return window.api.invoke(TwowayChannel.ServiceManagement, req)
  }

  public async stopServicesByGroup(groupId: string) {
    const group = await this.groupService.findOne(groupId)
    if (group) {
      window.api.invoke(TwowayChannel.ServiceManagement, {
        op: ServiceOperation.StopProxyServicesByGroup,
        groupInfo: group
      } as ServiceMgtRequest)
    }
  }

  public async fetchServiceStatus(serviceId: string): Promise<ProxyServiceInfo> {
    const services = await this.batchFetchServiceStatus([serviceId])
    return await Promise.resolve(services[0])
  }

  public async batchFetchServiceStatus(serviceIds: string[]): Promise<ProxyServiceInfo[]> {
    const req: ServiceMgtRequest = {
      op: ServiceOperation.getProxyServiceStatus,
      serviceIds: serviceIds
    }
    try {
      const result: any[] = await window.api.invoke(TwowayChannel.ServiceManagement, req)
      return result.map((rs) => Object.assign({} as ProxyServiceInfo, rs))
    } catch (e) {
      if (e instanceof Error) {
        console.log(
          'fetch service status failed, serviceId=' + serviceIds.join(','),
          (e as Error).message
        )
        return Promise.reject((e as Error).message)
      } else {
        return Promise.reject(e)
      }
    }
  }

  public async deleteService(serviceId: string): Promise<any> {
    const req: ServiceMgtRequest = {
      op: ServiceOperation.DeleteProxyService,
      serviceId: serviceId
    }
    return window.api.invoke(TwowayChannel.ServiceManagement, req).then(() => {
      return this.deleteOne({ query: { _id: serviceId } })
    })
  }

  public async updateService(serviceId: string, service: ProxyService): Promise<any> {
    return this.updateOne({
      query: { _id: serviceId },
      update: {
        $set: {
          forwardConfigs: service.forwardConfigs,
          configKey: service.configKey
        }
      }
    })
      .then(() => {
        // 通知后台serviceClient更新配置
        return window.api.invoke(TwowayChannel.ServiceManagement, {
          op: ServiceOperation.ReloadServiceInfo,
          serviceId: serviceId
        } as ServiceMgtRequest)
      })
      .catch((e) => {
        if (e instanceof Error) {
          NotifyUtils.error((e as Error).message)
        } else {
          NotifyUtils.error(e)
        }
      })
  }
}
