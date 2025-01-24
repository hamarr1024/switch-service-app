import net from 'net'

export class NetworkUtils {
  public static isPortAvailable(port: number) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      const server = net.createConnection({ port })
      server.on('connect', () => {
        server.end()
        reject(`端口${port}已被占用`)
      })
      server.on('error', () => {
        resolve(true)
      })
    })
  }
}
//
//
// try {
//   let res = await isPortAvailable(18006)
//   console.log('res', res)
// } catch(e) {
//   console.log('error', e)
// }
// .then(
//     msg => console.log("resolved", msg),
//     err => console.log("reject", err)
// ).catch(e => console.log('catch: ', e))
