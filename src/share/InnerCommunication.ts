import { StatusCode } from './ApplicationModels'

export enum TwowayChannel {
  DML = 'ch-dml',
  ServiceManagement = 'ch-service-management' // 服务管理

}

export enum OnewayChannel {
  ToRender = 'ch-to-render',
  ToMain = 'ch-to-main',
  ServiceClientStatusChange = 'ch-client-status-change',
  ServiceClientHeartBeat = 'ch-client-heartbeat',
  ServiceClientError = 'ch-client-error',
  SelectGroupByTray = 'ch-tray-select-group',
  SelectConfigByTray = 'ch-tray-select-config'
}

export class Response {
  code?: StatusCode
  msg?: string
  data?: any

  constructor(code, msg, data) {
    this.code = code
    this.msg = msg
    this.data = data
  }

  public static ofSuccess(data: any): Response {
    return new Response(StatusCode.success, '', data)
  }

  public static ofError(msg: string): Response {
    return new Response(StatusCode.error, msg, null)
  }
}
