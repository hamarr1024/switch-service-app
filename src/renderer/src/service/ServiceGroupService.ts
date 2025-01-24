import { Database } from '@share/DMLContract'
import { ServiceGroup } from '@share/ApplicationModels'
import BaseService from './BaseService'

export default class ServiceGroupService extends BaseService<ServiceGroup> {
  protected database(): Database {
    return Database.ServiceGroup
  }
}
