import { RegistryType, ServiceGroup } from '../../../share/ApplicationModels'
import { ServiceMgtRequest, ServiceOperation } from '../../../share/ServiceManagementContract'
import { createAxios } from '../../http/axios'
import { IServiceMgtHandler } from '../IServiceMgtHandler'

const axios = createAxios()
const baseUrl = function (group: ServiceGroup) {
  return 'http://' + group.registry.host + ':' + group.registry.port
}

export class GetAppInfoHandler implements IServiceMgtHandler {
  op(): ServiceOperation {
    return ServiceOperation.GetAppInfoList
  }

  public async handle(request: ServiceMgtRequest): Promise<any> {
    const groupInfo = request.groupInfo!
    if (RegistryType.Eureka === groupInfo.registry.type) {
      try {
        let resp = await axios.get(baseUrl(groupInfo) + '/eureka/apps', {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        })
        return resp
      } catch (e) {
        return Promise.reject(e)
      }
    } else {
      return Promise.reject('unsupported registry type:' + groupInfo.registry.type)
    }
  }
}
