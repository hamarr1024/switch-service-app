import Datastore from 'nedb-promises'
import os from 'os'
import fs from 'fs'
import { ProxyService, ServiceGroup, UserRuntime } from '../../share/ApplicationModels'



export class SwitchServiceDB {
  private static _instance: SwitchServiceDB

  public static getInstance() {
      return this._instance || (SwitchServiceDB._instance = new SwitchServiceDB())
  }
  // rootDir
  private rootDir?: string

  // dbs
  private _userRuntimeDB?: Datastore<UserRuntime>
  public get userRuntimeDB() {
    return this._userRuntimeDB || (this._userRuntimeDB = this.create('UserRuntime.db'))
  }

  private _serviceGroupDB?: Datastore<ServiceGroup>
  public get serviceGroupDB() {
    return this._serviceGroupDB || (this._serviceGroupDB = this.create('ServiceGroup.db'))
  }

  private _proxyServiceDB?: Datastore<ProxyService>
  public get proxyServiceDB() {
    return this._proxyServiceDB || (this._proxyServiceDB = this.create('ProxyService.db'))
  }



  private create(dbName: string): Datastore<any> {
    // console.log(this.rootDir + dbName)
    return Datastore.create({
      filename: this.rootDir + dbName,
      autoload: true
    })
  }

  private constructor() {
    this.init()
  }

  init() {
    // 1. 创建文件夹
    this.rootDir = this.createDbPath()
    // console.log(this.rootDir)
  }

  private createDbPath(): string {
    const userDir = os.homedir()
    // console.log(userDir)
    const dbPath = userDir + '\\\.switchservice\\'
    // console.log(dbPath)

    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath)
    }
    return dbPath
  }
}


