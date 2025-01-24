import Datastore from "nedb-promises"
import { ProxyService} from "../../share/ApplicationModels"
import { BaseDao } from "./Dao"
import {SwitchServiceDB} from "./DB"
const db = SwitchServiceDB.getInstance()

export class ProxyServiceDao extends BaseDao<ProxyService> {
    getDB(): Datastore<ProxyService> {
        return db.proxyServiceDB
    }
}