
import { ServiceMgtRequest, ServiceOperation } from '../../share/ServiceManagementContract'


export interface IServiceMgtHandler {
  op(): ServiceOperation
  handle(request: ServiceMgtRequest): Promise<any>
}



