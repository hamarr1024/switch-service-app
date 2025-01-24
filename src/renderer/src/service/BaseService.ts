import { Database, DBOperation, DBRequest, DBResponse, Delete, Query, Update } from '@share/DMLContract'
import { TwowayChannel } from '@share/InnerCommunication'

export default abstract class BaseService<T> {
  protected abstract database(): Database

  public async findOne(groupId: string): Promise<T> {
    const query: Query = {
      query: {_id: groupId}
    }

    let req = DBRequest.create(this.database(), DBOperation.FindOne, query)
    return this.doInvokeDB(req)
  }


  public async findAll(): Promise<T[]> {
    const query: Query = {
      query: {},
      sort: { createTime: 1 }
    }
    let req = DBRequest.create(this.database(), DBOperation.Find, query)
    return this.doInvokeDB(req)
  }

  public async findMany(query: Query): Promise<T[]> {
  
    let req = DBRequest.create(this.database(), DBOperation.Find, query)
    return this.doInvokeDB(req)
  }

  public async insert(doc: T): Promise<T> {
    let req = DBRequest.create(this.database(), DBOperation.Insert, doc)
    return this.doInvokeDB(req)
  }

  public async updateOne(update: Update): Promise<T | null> {
    let req = DBRequest.create(this.database(), DBOperation.UpdateOne, update)
    return this.doInvokeDB(req)
  }

  public async deleteOne(query: Delete): Promise<number> {
    let req = DBRequest.create(this.database(), DBOperation.DeleteOne, query)
    return this.doInvokeDB(req)
  }

  private async doInvokeDB(req: DBRequest) {
    try {
      let resp = (await window.api.invoke(TwowayChannel.DML, req)) as DBResponse
      // console.log('baseService: resp', resp)
      if (!resp || !resp.isSuccess) {
        throw new Error(req.db + "." + req.op + ' failed, reason=' + resp.errorMsg)
      }
      return Promise.resolve(resp.output)
    } catch (e) {
      throw new Error(req.db + "." + req.op + ' doc failed, reason=' + e)
    }
  }
}
