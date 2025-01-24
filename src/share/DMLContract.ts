
export interface Query {
  query?: Object
  sort?: Object
  skip?: number
  limit?: number
}

export interface Update {
  query: Object
  update: Object
}
export interface Delete {
  query: Object
  multi?: boolean
}

export enum Database {
  ServiceGroup = 'db-service-group',
  UserRuntime = 'db-user-runtime',
  ProxyService = 'db-proxy-service'
}
export enum DBOperation {
  Insert = 'insert',
  Find = 'find',
  FindOne = 'findOne',
  UpdateOne = 'updateOne',
  DeleteOne = 'deleteOne'
}

export class DBRequest {
  db: Database
  op: DBOperation
  input: any

  public constructor(db: Database, op: DBOperation, input: any) {
    this.db = db
    this.op = op
    this.input = input
  }

  public static create(db: Database, op: DBOperation, input: any) {
    return new DBRequest(db, op, input)
  }

}
export class DBResponse  {
  isSuccess: boolean
  errorMsg: string
  output: any
  public constructor(isSuccess: boolean, errorMsg: string, output: any) {
    this.isSuccess = isSuccess
    this.errorMsg = errorMsg
    this.output = output
  }

  public static ofSuccess(output: any): DBResponse {
    return new DBResponse(true, '', output)
  }

  public static ofError(errorMsg: string) {
    return new DBResponse(false, errorMsg, null)
  }
}
