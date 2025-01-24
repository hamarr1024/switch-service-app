export enum StatusCode {
  success = '200',
  not_found = '404',
  error = '500'
}

export enum RegistryType {
  Eureka = 'Eureka'
}

export namespace RegistryType {
  export function of(value: string) {
    switch (value) {
      case 'Eureka':
        return RegistryType.Eureka
      default:
        throw new Error('Invalid RegistryType')
    }
  }
}

export interface Model {
  createTime?: Date,
  updateTime?: Date
}

// userRuntime
export class UserRuntime implements Model {
  _id?: string
  selectedGroupId: string
  folded: boolean
  createTime: Date

  public constructor(selectedGroupId: string, folded: boolean) {
    this.selectedGroupId = selectedGroupId
    this.folded = folded
    this.createTime = new Date()
  }
}
export class ServiceRegistry implements Model {
  type: RegistryType
  host: string
  port: number
  createTime?: Date

  public constructor(type: RegistryType, host: string, port: number) {
    this.type = type
    this.host = host
    this.port = port
    this.createTime = new Date()
  }
}
// 服务组
export class ServiceGroup implements Model {
  _id?: string
  name: string
  registry: ServiceRegistry
  createTime?: Date
  public constructor(name: string, registry: ServiceRegistry) {
    this.name = name
    this.registry = registry
    this.createTime = new Date()
  }
}

// 代理服务
export interface ProxyServiceInfo {
  id: string,
  status: string,
  errorMsg?: string,
  instanceId?: string,
  serviceName?: string,
  host?: string,
  port?: number,
  lastRenewalTimestamp?: number,
  lastStartTimestamp?: number,
  healthCheckUrl?: string,
  statusPageUrl?: string
}

export interface ProxyService extends Model {
  _id?: string
  groupId?: string
  serviceName: string
  instanceId: string
  // status?: string
  // boundStatus: number, // 1-
  // boundProcessId: string // 绑定的子进程id
  host: string,
  port: number // 监听的端口号
  forwardConfigs?: ForwardConfig [],
  configKey?: string
  registry: ServiceRegistry
}

// 服务转发选项
export interface  ForwardConfig {
  key: string
  baseUrl: string
}

// 注册中心模型
export class RegistryApplication {
  name?: string 
  instances?: RegistryServiceInstance[]
}

export class RegistryServiceInstance {
  id?: string 
  appName?: string 
  status?: string
  host?: string 
  port?: number
}

// others
export type SubscribeOnewayChannelKey = 'ProxyPanel' | 'Home'