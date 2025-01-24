import { ServiceGroup } from "./ApplicationModels";

// 微服务管理契约，渲染进程委托主进程获取微服务信息、注册等操作
export enum ServiceOperation {
    GetAppInfoList = "getAppInfoList",
    StartProxyService = "startProxyService",
    StopProxyService = "stopProxyService",
    StopProxyServicesByGroup = "stopProxyServicesByGroup",
    getProxyServiceStatus = "getProxyServiceStatus",
    DeleteProxyService = "deleteProxyService",
    ReloadServiceInfo = "reloadServiceInfo"
}

export class BaseRequest {
    op: ServiceOperation
    groupInfo?: ServiceGroup

    constructor(op: ServiceOperation, groupInfo: ServiceGroup) {
        this.op = op
        this.groupInfo = groupInfo
    }
}

export class ServiceMgtRequest extends BaseRequest {
    // ProxyService dbid
    serviceId?: string
    serviceIds?: string[]
}
