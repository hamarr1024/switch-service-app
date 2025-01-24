import Datastore from "nedb-promises"
import { ServiceGroup } from "../../share/ApplicationModels"
import { BaseDao } from "./Dao"
import {SwitchServiceDB} from "./DB"
const db = SwitchServiceDB.getInstance()

export class ServiceGroupDao extends BaseDao<ServiceGroup> {
    getDB(): Datastore<ServiceGroup> {
        return db.serviceGroupDB
    }
}