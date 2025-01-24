import { StatusChangeInfo } from '../../share/ServiceClientStatusChangeContracts'
import { Eureka } from 'eureka-js-client'
import type { Request, Response } from 'express'
import express, { Express } from 'express'
import dynamicMiddleware, { DynamicMiddleware } from 'express-dynamic-middleware'
import * as http from 'http'
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware'
import { ProxyService } from '../../share/ApplicationModels'
import { NetworkUtils } from '../../share/utils/NetworkUtils'
import { ProxyServiceDao } from '../dao/ProxyServiceDao'
import {
  ClientStatus,
  EventListener,
  EventPublisher,
  EventType,
  ServiceClient,
  ServiceClientError,
  ServiceClientInfo
} from './Models'
import { deserialize, serialize } from 'ts-jackson'



abstract class AbstractEventPublisher implements EventPublisher {
  subscribers: Map<EventType, EventListener[]>
  constructor(subscribersMap: Map<EventType, EventListener[]>) {
    this.subscribers = subscribersMap
  }
  addListener(event: EventType, listener: EventListener): void {
    let listeners = this.subscribers.get(event)
    if (!listeners) listeners = []
    listeners.push(listener)
    this.subscribers.set(event, listeners)
  }

  removeListener(event: EventType, listener: EventListener): void {
    let listeners = this.subscribers.get(event)
    if (listeners && listeners.length > 0) {
      listeners = listeners.filter((l) => l !== listener)
      this.subscribers.set(event, listeners)
    }
  }

  fire(event: EventType, data: any, cb?: () => void): void {
    if (cb) {
      cb()
    }
    let listeners = this.subscribers.get(event)
    if (listeners) {
      listeners.forEach((l) => l.on(event, data))
    }
  }
}

export class EurekaClient extends AbstractEventPublisher implements ServiceClient {
  private id: string
  private _status: ClientStatus = 'new'
  private proxyServiceDao: ProxyServiceDao = new ProxyServiceDao()
  // setup later
  private proxyService?: ProxyService
  private client: Eureka | undefined
  private expressApp?: Express
  private server?: http.Server
  private _errMsg?: string
  private _lastStartTimestamp = 0
  private _lastRenewalTimestamp = 0
  private dynamic: DynamicMiddleware = dynamicMiddleware.create()

  constructor(id: string) {
    super(new Map<EventType, EventListener[]>())
    this.id = id
  }

  getId(): string {
    return this.id
  }

  get status(): ClientStatus {
    return this._status
  }

  get errMsg() {
    return this._errMsg
  }

  set errMsg(newMsg: string | undefined) {
    const old = this._errMsg
    this._errMsg = newMsg
    if (old !== newMsg) {
      this.fire(EventType.statusChange, {
        serviceId: this.id,
        before: {
          errorMsg: old
        },
        after: {
          errorMsg: newMsg
        }
      } as StatusChangeInfo)
    }
  }

  set status(newStatus: ClientStatus) {
    const oldStatus = this._status
    this._status = newStatus
    if (oldStatus !== newStatus) {
      this.fire(EventType.statusChange, {
        serviceId: this.id,
        before: {
          status: oldStatus
        },
        after: {
          status: newStatus
        }
      } as StatusChangeInfo)
    }
  }

  get lastRenewalTimestamp() {
    return this._lastRenewalTimestamp
  }

  set lastRenewalTimestamp(newVal: number) {
    this._lastRenewalTimestamp = newVal
  }

  get lastStartTimestamp() {
    return this._lastStartTimestamp
  }

  set lastStartTimestamp(newVal: number) {
    this._lastStartTimestamp = newVal
  }

  get healthCheckUrl() {
    if (this.proxyService) {
      return `http://${this.proxyService.host}:${this.proxyService.port}/ss/health`
    }
    return ''
  }

  get statusPageUrl() {
    if (this.proxyService) {
      return `http://${this.proxyService.host}:${this.proxyService.port}/ss/info`
    }
    return ''
  }

  getClientInfo(): ServiceClientInfo {
    const result = {
      id: this.id,
      groupId: this.proxyService?.groupId,
      instanceId: this.proxyService?.instanceId,
      serviceName: this.proxyService?.serviceName,
      status: this._status,
      errorMsg: this.errMsg,
      host: this.proxyService?.host,
      port: this.proxyService?.port,
      lastRenewalTimestamp: this.lastRenewalTimestamp,
      lastStartTimestamp: this.lastStartTimestamp,
      healthCheckUrl: this.healthCheckUrl,
      statusPageUrl: this.statusPageUrl,
      metadata: {
        configKey: this.proxyService?.configKey,
        forwardConfigs: this.proxyService?.forwardConfigs
      }
    } as ServiceClientInfo
    // console.log('result....', result)
    return result
  }

  start(): Promise<string> {
    // 1. 检查状态
    if (this.status === 'new' || this.status === 'exited' || this.status === 'error') {
      return this.startInternal()
    } else {
      return Promise.reject('start client failed, due to that client status is ' + this.status)
    }
  }

  stop(): Promise<string> {
    // 1. 检查状态
    switch (this.status) {
      case 'running':
        return this.stopInternal()
      case 'exited':
        return Promise.reject('已终止服务，刷新获取最新状态')
      case 'exiting':
        return Promise.reject('正在终止服务，请耐心等待...')
      case 'error':
      case 'new':
      case 'starting':
        return Promise.reject('服务不在运行中，刷新获取最新状态')
      default:
        return Promise.reject('服务状态不明，可能有bug，刷新获取最新状态或重启应用')
    }
  }

  stopQuietly(): Promise<string> {
      if (this.status === 'running') {
        return this.stopInternal()
      }
      return Promise.resolve('Already stopped')
  }

  async reloadServiceInfo(): Promise<string> {
    const oldService = this.proxyService!
    const newService = await this.proxyServiceDao.findOne({
      query: { _id: this.id }
    })
    this.proxyService = newService
    this.updateProxyIfRequired(oldService, newService)
    return Promise.resolve('ok')
  }

  private updateProxyIfRequired(oldService: ProxyService, newService: ProxyService) {
    const oldConfig = oldService.forwardConfigs!.find((c) => c.key === oldService.configKey!)!
    const newConfig = newService.forwardConfigs!.find((c) => c.key === newService.configKey!)!
    // 1. key变了
    // 2. key没变，url变了
    if (oldConfig.key !== newConfig.key || oldConfig.baseUrl !== newConfig.baseUrl) {
      this.doUpdateProxy()
      return
    }

    // 3. 其它情况忽略
  }

  private doUpdateProxy() {
    const proxy = this.newProxy(this.proxyService!)
    this.dynamic.clean()
    this.dynamic.use(proxy)
    console.log('proxy config changed')
  }

  private async setup() {
    const service = await this.proxyServiceDao
      .findOne({
        query: { _id: this.id }
      })
    this.proxyService = service
    this.client = this.createEurekaClient(this.proxyService)
    if (!this.expressApp) {
      this.expressApp = this.createExpressApp(this.proxyService)
    }
    return 'ok'
  }

  private async startInternal(): Promise<string> {
    try {
      await this.setup()
      const service = this.proxyService!
      // 1. 检查端口是否被占用
      const isPortAvailable = await NetworkUtils.isPortAvailable(service.port)
      if (!isPortAvailable) {
        this.status = 'error'
        this.errMsg = `端口 ${service.port} 被占用!`
        return Promise.reject(`端口 ${service.port} 被占用!`)
      }
      // 2. 开始创建流程, 异步转同步：启动server => 启动eureka
      this.status = 'starting'
      // this.errMsg = undefined
      this.server = await this.startServerPromise(this.expressApp!, this.proxyService!)
      await this.startEurekaClientPromise(this.client!)
      this.status = 'running'
      this.errMsg = undefined
      return Promise.resolve('ok')
    } catch (e) {
      console.log('start internal error', e)
      this.status = 'error'
      if (e instanceof Error) {
        this.errMsg = (e as Error).message
      } else if (typeof(e)=== 'string') {
        this.errMsg = e as string
      } else {
        this.errMsg = 'unknown error occured when starting Eureka client'
      }
      // console.log('erroMsg is ' + this.errMsg)
      // clear server and eurekaclient
      this.clearClientAndServer()
      return Promise.reject(this.errMsg)
    }
  }

  private startServerPromise(app: Express, service: ProxyService): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      const server = app
        .listen(service.port, () => {
          console.log(`Server started, listening on port at http://${service.host}:${service.port}`)
          return resolve(server)
        })
        .on('error', (err) => {
          return reject(err)
        })
    })
  }

  private startEurekaClientPromise(client: Eureka) {
    return new Promise((resolve, reject) => {
      client.start((err) => {
        if (!err) {
          console.log('Eureka client start successfully')
          resolve('ok')
        } else {
          reject(err)
        }
      })
    })
  }

  private createExpressApp(service: ProxyService) {
    const app = express()

    // healthCheck
    app.get('/ss/health', (_, res) => {
      res.status(200).json({ status: 'UP' })
    })
    // info
    app.get('/ss/info', (_, res) => {
      res.status(200).json(this.getClientInfo())
    })

    // proxy, wrapped by dynamic
    this.dynamic.use(this.newProxy(service))
    app.use('/', this.dynamic.handle())

    return app
  }

  private newProxy(service: ProxyService) {
    const config = service.forwardConfigs!.find((c) => c.key === service.configKey)

    return createProxyMiddleware<Request, Response>({
      target: config!.baseUrl,
      pathFilter: ['!/ss/**', '**'],
      changeOrigin: true,
      selfHandleResponse: true,
      // plugins: [simpleRequestLogger],
      on: {
        proxyRes: responseInterceptor((responseBuffer, proxyRes, req, _) => {
          const exchange = `[DEBUG] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`
          console.log(exchange) // [DEBUG] GET / -> http://www.example.com [200]
          // detect json responses
          if (proxyRes.headers['content-type']?.includes('application/json')) {
            console.log('on proxyRes')
            try {
               let response = responseBuffer.toString('utf-8')
              console.log((response))
            } catch(e) {
              console.log('ignore error', e)
              // ignore
            }
           // return manipulated JSON
            
          }

          // return other content-types as-is
          return responseBuffer
        }),
        error: (err, req, res) => {
          res.writeHead(500, {
            'Content-Type': 'text/plain'
          })
          const msg = `Error occured when proxying: ${req.method} ${req.path} -> ${config?.baseUrl}${req.path}`
          this.fire(EventType.error, {
            serviceId: service._id,
            serviceName: service.serviceName,
            code: err.code,
            msg: msg
          } as ServiceClientError)
          res.end(msg + '\r\n' + 'errorCode:' + err.code, (e) => {
            console.log(e)
          } )
        }
      }
    })
  }

  private createEurekaClient(service: ProxyService): Eureka {
    const { instanceId, serviceName, host, port } = { ...service }
    const eurekaClient = new Eureka({
      instance: {
        instanceId: instanceId,
        app: serviceName,
        hostName: host,
        ipAddr: host,
        port: {
          $: port,
          '@enabled': true
        },
        securePort: {
          $: 443,
          '@enabled': false
        },
        vipAddress: serviceName,
        healthCheckUrl: this.healthCheckUrl,
        statusPageUrl: this.statusPageUrl,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn'
        }
      },
      eureka: {
        host: '127.0.0.1',
        port: 8761,
        servicePath: '/eureka/apps/',
        heartbeatInterval: 30000
      }
    })

    eurekaClient.on('started', () => {
      console.log('Eureka client started')
      this.lastStartTimestamp = new Date().getTime()
    })

    eurekaClient.on('registered', () => {
      console.log('Eureka client registered')
    })

    eurekaClient.on('deregistered', () => {
      console.log('Eureka client deregistered')
    })

    eurekaClient.on('heartbeat', () => {
      this.lastRenewalTimestamp = new Date().getTime()
      console.log('Eureka client heartbeat')
    })

    eurekaClient.on('registryUpdated', () => {
      console.log('Eureka registry updated')
    })
    eurekaClient.on('error', (err) => {
      console.log('拉拉。。', err)
    })

    return eurekaClient
  }

  private async stopInternal(): Promise<string> {
    if (!this.client || !this.server || !this.expressApp) {
      return Promise.reject('eureka client is not existed')
    }
    try {
      this.status = 'exiting'
      // this.errMsg = undefined
      await this.stopEurekaPromise(this.client)
      await this.stopServerPromise(this.server)
      this.status = 'exited'
      this.errMsg = undefined
      return Promise.resolve('ok')
    } catch (e) {
      console.log('stop internal error', e)
      this.status = 'error'
      this.errMsg = (e as Error).message
      // stop server again
      this.clearClientAndServer()
      return Promise.reject((e as Error).message)
    }
  }

  private clearClientAndServer() {
    if (this.client) {
      try {
        this.client.stop()
      } catch (e) {
        console.log(e)
      } finally {
        this.client = undefined
      }
    }
    if (this.server) {
      try {
        this.server.close()
      } catch (e) {
        console.log(e)
      } finally {
        this.server = undefined
      }
    }
  }

  private stopEurekaPromise(client: Eureka) {
    return new Promise(function (resolve, reject) {
      client!.stop((err) => {
        if (!err) {
          console.log('Eureka client stop successfully')
          resolve('ok')
        } else {
          reject(err)
        }
      })
    })
  }

  private stopServerPromise(server: http.Server) {
    return new Promise((resolve, reject) => {
      server.closeAllConnections()
      server.close((err) => {
        if (!err) {
          console.log('server stopped successfully!')
          resolve('ok')
        } else {
          reject(err)
        }
      })
    })
  }
}
