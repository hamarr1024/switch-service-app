import { WebContents } from 'electron'
import { OnewayChannel } from '../../../share/InnerCommunication'
import { ServiceMgtRequest, ServiceOperation } from '../../../share/ServiceManagementContract'
import { EurekaClient } from '../../microservice/EurekaClient'
import {
  EventListener,
  EventType,
  ServiceClient,
  ServiceClientInfo
} from '../../microservice/Models'
import { IServiceMgtHandler } from '../IServiceMgtHandler'

abstract class ServiceClientHandler implements IServiceMgtHandler, EventListener {
  protected static CLIENT_MAP = new Map<string, ServiceClient>()
  webContents: WebContents
  abstract op(): ServiceOperation
  abstract handle(request: ServiceMgtRequest): Promise<any>

  constructor(webContents: WebContents) {
    this.webContents = webContents
  }
  protected getClientById(serviceId: string): ServiceClient | undefined {
    return ServiceClientHandler.CLIENT_MAP.get(serviceId)
  }

  protected getClientsByGroupId(groupId: string): ServiceClient[] {
    let result = [] as ServiceClient[]
    ServiceClientHandler.CLIENT_MAP.forEach((client) => {
      if (client.getClientInfo().groupId === groupId) {
        result.push(client)
      }
    })
    return result
  }

  protected setClient(serviceId: string, client: ServiceClient) {
    ServiceClientHandler.CLIENT_MAP.set(serviceId, client)
  }

  protected removeClientById(serviceId: string): ServiceClient | undefined {
    let client: ServiceClient | undefined
    if (ServiceClientHandler.CLIENT_MAP.has(serviceId)) {
      client = ServiceClientHandler.CLIENT_MAP.get(serviceId)
      ServiceClientHandler.CLIENT_MAP.delete(serviceId)
    }
    return client
  }

  on(event: EventType,  data: any) {
    if (event == EventType.statusChange) {
      this.webContents.send(OnewayChannel.ServiceClientStatusChange, data)
    }
    if (event == EventType.heartbeat) {
      // console.log('heatbeat', data)
      this.webContents.send(OnewayChannel.ServiceClientHeartBeat, data)
    }
    if (event == EventType.error) {
      this.webContents.send(OnewayChannel.ServiceClientError, data)
    }
  }
}

class StartServiceClientHandler extends ServiceClientHandler {
  op(): ServiceOperation {
    return ServiceOperation.StartProxyService
  }
  handle(request: ServiceMgtRequest): Promise<any> {
    let client = this.getClientById(request.serviceId!)
    if (!client) {
      client = new EurekaClient(request.serviceId!)
      client.addListener(EventType.statusChange, this)
      client.addListener(EventType.error, this)
      this.setClient(request.serviceId!, client)
    }
    return client.start()
  }
}

class StopServiceClientHandler extends ServiceClientHandler {
  op(): ServiceOperation {
    return ServiceOperation.StopProxyService
  }

  handle(request: ServiceMgtRequest): Promise<any> {
    let client = this.getClientById(request.serviceId!)
    if (!client) {
      return Promise.reject('no client existed!')
    }
    return client.stop()
  }
}

class GetServiceClientStatusHandler extends ServiceClientHandler {
  op(): ServiceOperation {
    return ServiceOperation.getProxyServiceStatus
  }

  handle(request: ServiceMgtRequest): Promise<ServiceClientInfo[]> {
    const serviceIds = request.serviceIds
    const result: ServiceClientInfo[] = serviceIds!.map((id) => {
      const client = this.getClientById(id)
      if (!client) {
        return {
          id: id,
          status: 'notCreated'
        }
      }

      return client.getClientInfo()
    })

    return Promise.resolve(result)
  }
}

class DeleteServiceClientHandler extends ServiceClientHandler {
  op(): ServiceOperation {
      return ServiceOperation.DeleteProxyService
  }
  handle(request: ServiceMgtRequest): Promise<any> {
      const serviceId = request.serviceId
      if (serviceId) {
        this.removeClientById(serviceId)
      }
      return Promise.resolve('ok')
  }
}

class ReloadServiceInfoClientHandler extends ServiceClientHandler {
  op(): ServiceOperation {
      return ServiceOperation.ReloadServiceInfo
  }
  handle(request: ServiceMgtRequest): Promise<any> {
    let client = this.getClientById(request.serviceId!)
    if (!client) {
      return Promise.resolve('no client existed!')
    }
    return client.reloadServiceInfo()
  }
}

class StopSeviceClientsByGroupHandler extends ServiceClientHandler {
  op(): ServiceOperation {
    return ServiceOperation.StopProxyServicesByGroup
  }

  handle(request: ServiceMgtRequest): Promise<any> {
    const group = request.groupInfo!
    const clients = this.getClientsByGroupId(group._id!)
    if (clients) {
      return Promise.all(clients.map(c => c.stopQuietly()))
    }
    return Promise.resolve('ok')
  }

}

export default { 
  StartServiceClientHandler, 
  GetServiceClientStatusHandler, 
  StopServiceClientHandler,
  DeleteServiceClientHandler,
  ReloadServiceInfoClientHandler,
  StopSeviceClientsByGroupHandler
}
