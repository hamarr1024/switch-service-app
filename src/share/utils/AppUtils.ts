export default class AppUtils {
  public static getInstanceId(serviceName: string, host: string, port: number) {
    return `ss-proxy@${serviceName}@${host}:${port}`
  }

  public static getTimeElapsedTips(_0,_1,timestamp: number | undefined) : string{
    if (!timestamp) return ''
    const now = new Date().getTime()
    const elapsedSec = Math.floor((now - timestamp)/1000)
    if (elapsedSec < 60) return `${elapsedSec} seconds ago`
    if (elapsedSec < 3600) return `${Math.floor(elapsedSec/60)} minutes ago` 
    if (elapsedSec < 3600*24) return `${Math.floor(elapsedSec/3600)} hours ago`
    return `${Math.floor(elapsedSec/(3600*24))} days ago`
  }
}
