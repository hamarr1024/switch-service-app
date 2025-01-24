export enum EventType {
    statusChange,
    heartbeat,
    error
}

export interface EventListener {
    on(event:EventType,  data: any): void
}

export interface EventPublisher {
    addListener(event: EventType, listener: EventListener): void
    removeListener(event: EventType, listener: EventListener): void
    fire(event:EventType, data:any): void
}


// new -> starting -> running -> exiting -> exited->starting->..
export type ClientStatus = 'notCreated' | 'new' | 'starting' | 'running' | 'exiting' | 'exited' | 'error'
// export enum ClientStatus {
//     notCreated = 'notCreated', // 尚未创建
//     new = 'new', // 创建但未启动客户端
//     starting = 'starting', // 启动中
//     running = 'running', // 客户端运行并正常提供服务
//     exiting = 'exiting', // 退出中
//     exited = 'exited', // 客户端关闭
//     error = 'error' // 异常状态
// }

export interface ServiceClient extends EventPublisher {
    getId(): string
    getClientInfo(): ServiceClientInfo
    start(): Promise<string>
    stop(): Promise<string>
    stopQuietly(): Promise<string>
    reloadServiceInfo(): Promise<string>
}


export interface ServiceClientInfo {
    id: string,
    status: ClientStatus,
    groupId?: string,
    instanceId?: string,
    serviceName?: string,
    host?: string,
    port?: number,
    lastRenewalTimestamp?: number,
    lastStartTimestamp?: number,
    healthCheckUrl?: string,
    statusPageUrl?: string,
    metadata?: Object
}

export interface ServiceClientError {
    serviceId: string
    serviceName: string
    code: string,
    msg: string
}
