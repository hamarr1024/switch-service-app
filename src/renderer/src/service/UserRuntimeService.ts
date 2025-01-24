import { Database } from '@share/DMLContract'
import { UserRuntime } from '@share/ApplicationModels'
import BaseService from './BaseService'

export default class UserRuntimeService extends BaseService<UserRuntime> {
  protected database(): Database {
    return Database.UserRuntime
  }

  public async loadUserRuntime(): Promise<UserRuntime | null> {
    let results = await this.findAll()
    return !!results && results.length > 0 ? Promise.resolve(results[0]) : Promise.resolve(null)
  }
}
