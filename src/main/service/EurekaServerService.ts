import { Instance } from '../../share/EurekaModels'
import { createAxios } from '../http/axios'
import { ServiceRegistry } from '../../share/ApplicationModels'
const axios = createAxios()
export class EurekaServer {
  private static CACHE: Map<string, EurekaServer> = new Map<string, EurekaServer>()
  host: string
  port: number
  servicePath = '/eureka/apps'
  constructor(host: string, port:number) {
    this.host = host
    this.port = port
  }

  public static of(registry: ServiceRegistry) {
    const key = EurekaServer.getKey(registry)
    if (!EurekaServer.CACHE.has(key)) {
        EurekaServer.CACHE.set(key, new EurekaServer(registry.host, registry.port))
    }
    return EurekaServer.CACHE.get(key)!
  }

  private static getKey(registry: ServiceRegistry) {
    return registry.host + ':' + registry.port
  }

  private baseUrl() {
    return `http://${this.host}:${this.port}/${this.servicePath}`
  }

  public async getInstanceById(serviceName: string, instanceId: string): Promise<Instance | null> {
    try {
      let resp = await axios.get(this.baseUrl() + `/${serviceName}/${instanceId}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
      if (!resp || !resp.data) return Promise.resolve(null)
      return Promise.resolve(resp.data.instance)
    } catch (e) {
      return Promise.reject((e as Error).message)
    }
  }
}
