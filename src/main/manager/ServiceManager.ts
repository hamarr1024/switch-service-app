import { IpcMain, WebContents } from "electron";
import { ServiceMgtRequest, ServiceOperation } from "../../share/ServiceManagementContract";

import { TwowayChannel } from "../../share/InnerCommunication";
import { IServiceMgtHandler } from "./IServiceMgtHandler";
import { GetAppInfoHandler } from "./handler/GetAppInfoHandler";
import chs from './handler/ServiceClientHandler';

export class ServiceManager {
    ipcMain: IpcMain
    webContents: WebContents
    handlerMap: Map<ServiceOperation, IServiceMgtHandler>

    constructor(ipcMain: IpcMain, webContents: WebContents) {
        this.ipcMain = ipcMain
        this.webContents = webContents
        this.handlerMap = new Map<ServiceOperation, IServiceMgtHandler>()
    }

    public init() {
        this.initHandlerMap()
        this.register()
    }

    private initHandlerMap() {
        this.handlerMap.set(ServiceOperation.GetAppInfoList, new GetAppInfoHandler())
        this.handlerMap.set(ServiceOperation.StartProxyService, new chs.StartServiceClientHandler(this.webContents))
        this.handlerMap.set(ServiceOperation.getProxyServiceStatus, new chs.GetServiceClientStatusHandler(this.webContents))
        this.handlerMap.set(ServiceOperation.StopProxyService, new chs.StopServiceClientHandler(this.webContents))
        this.handlerMap.set(ServiceOperation.StopProxyServicesByGroup, new chs.StopSeviceClientsByGroupHandler(this.webContents))
        this.handlerMap.set(ServiceOperation.DeleteProxyService, new chs.DeleteServiceClientHandler(this.webContents))
        this.handlerMap.set(ServiceOperation.ReloadServiceInfo, new chs.ReloadServiceInfoClientHandler(this.webContents))
    }

    private register() {
        this.ipcMain.handle(TwowayChannel.ServiceManagement, (_, req) => {
            return this.handle(req)
        })
    }

    public handle(req: ServiceMgtRequest) {
        const request = req as ServiceMgtRequest
        const op = request.op
        const handler = this.handlerMap.get(op)
        if (!handler) {
            throw new Error('no handler found for op: ' + op)
        }

        return handler.handle(request)
    }
}