import { ElectronAPI } from '@electron-toolkit/preload'
// import { DBChannel, DBRequest } from '../src/share/models'
import { OnewayChannel, TwowayChannel } from '../share/InnerCommunication'
import { SubscribeOnewayChannelKey } from '../share/ApplicationModels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      invoke: (channel: TwowayChannel, req: any) => Promise<any>
      subscribe: (key: SubscribeOnewayChannelKey, channel: OnewayChannel, cb: (data: any)=>void) => void
      unsubscribeAll: (channel: OnewayChannel) => void
    }
  }
}
