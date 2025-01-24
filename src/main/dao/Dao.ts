import { Model } from '../../share/ApplicationModels'
import { Delete, Query, Update } from '../../share/DMLContract'
import Datastore from 'nedb-promises'

export interface Dao<T extends Model> {
  getDB(): Datastore<T>
  insert(doc: T): Promise<T>
  find(query: Query): Promise<T[]>
  findOne(query: Query): Promise<T>
  updateOne(update: Update): Promise<T | null>
  deleteOne(query: Delete): Promise<number>
}

export abstract class BaseDao<T extends Model> implements Dao<T> {
  abstract getDB(): Datastore<T>

  async insert(doc: T): Promise<T> {
    doc.createTime = new Date()
    doc.updateTime = new Date()
    return await this.getDB().insert(doc)
  }

  async find(query: Query): Promise<T[]> {
    // console.log('query', query)
    if (!query) return Promise.resolve([])
    let findAction
    let db = this.getDB()

    if (!!query.query) {
      // console.log('query', query.query)
      findAction = db.find<T>(query.query!)
    } else {
      findAction = db.find<T>({})
    }

    if (!!query.sort) {
      // console.log('sort')
      findAction = findAction.sort(query.sort)
    }
    if (!!query.skip) {
      findAction = findAction.skip(query.skip)
    }
    if (!!query.limit) {
      findAction = findAction.limit(query.limit)
    }

    let result = await findAction.exec()
    // console.log('result', result)
    return result
  }

  async findOne(query: Query): Promise<T> {
    try {
      const result = await this.getDB().findOne(query.query!).exec()
      if (!result)
        return Promise.reject('findone: doc not found for query ' + JSON.stringify(query))
      return Promise.resolve(result)
    } catch (e) {
      return Promise.reject((e as Error).message)
    }
  }

  async updateOne(update: Update): Promise<T | null> {
    let updateObject = Object.assign({}, update.update)
    Object.assign(updateObject, { updateTime: new Date() })
    return await this.getDB().updateOne(update.query, update.update, { returnUpdatedDocs: true })
  }

  async deleteOne(query: Delete): Promise<number> {
    return await this.getDB().deleteOne(query.query, { multi: false })
  }
}
