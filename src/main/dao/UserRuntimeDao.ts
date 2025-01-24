import Datastore from 'nedb-promises'
import { UserRuntime } from '../../share/ApplicationModels'
import { BaseDao } from './Dao'
import { SwitchServiceDB } from './DB'

const db = SwitchServiceDB.getInstance()

export class UserRuntimeDao extends BaseDao<UserRuntime> {
    getDB(): Datastore<UserRuntime> {
        return db.userRuntimeDB
    }
    

}

