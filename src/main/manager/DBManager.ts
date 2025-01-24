import { IpcMain } from "electron"
import { Database, DBOperation, DBRequest, DBResponse } from "../../share/DMLContract"
import { TwowayChannel } from "../../share/InnerCommunication"
import { Dao } from "../dao/Dao"
import { ProxyServiceDao } from "../dao/ProxyServiceDao"
import { ServiceGroupDao } from "../dao/ServiceGroupDao"
import { UserRuntimeDao } from "../dao/UserRuntimeDao"

export class DBManager {
  ipcMain: IpcMain
  daoMap: Map<Database, Dao<any>>
  constructor(ipcMain: IpcMain) {
    this.ipcMain = ipcMain
    this.daoMap = new Map<Database, Dao<any>>
  }

  public init() {
    this.initDaos()
    this.register()
  }

  private initDaos() {
    this.daoMap.set(Database.ServiceGroup, new ServiceGroupDao())
    this.daoMap.set(Database.UserRuntime, new UserRuntimeDao())
    this.daoMap.set(Database.ProxyService, new ProxyServiceDao())
  }

  private register() {
    // console.log('channel: ' + channel)
    this.ipcMain.handle(TwowayChannel.DML, async (_, req) => {
        let request = req as DBRequest
        let database = request.db
        let dao = this.daoMap.get(database)
        if (!dao) {
          throw new Error('no dao found for database: ' + database)
        }
        // console.log('db:{}, req:{}', database, request)
        let output: any;
        switch(request.op) {
            case(DBOperation.Insert) :
                output = await dao?.insert(request.input);
                break;
            case(DBOperation.Find) :
                output = await dao?.find(request.input);
                break;
            case(DBOperation.FindOne) : 
                output = await dao?.findOne(request.input)
                break;
            case(DBOperation.UpdateOne) :
                output = await dao?.updateOne(request.input)
                break;
            case(DBOperation.DeleteOne) :
                output = await dao?.deleteOne(request.input)
                break;
            default:
                throw new Error("unsupported operation: " + request.op)
        }
        return Promise.resolve(DBResponse.ofSuccess(output))
    })
  }
}