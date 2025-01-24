import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { OnewayChannel, TwowayChannel } from '../share/InnerCommunication'

// Custom APIs for renderer
const subscribeMap = new Map<string, number>()
const getSubscribeKey = (key: string, channel: OnewayChannel) => {
  return key + '#' + channel
}
const api = {
  invoke: async function  (channel: TwowayChannel, req: any): Promise<any> {
    // console.log('req=', req)
      try {
        return await ipcRenderer.invoke(channel, req)
      } catch(e) {
        if (e instanceof Error) {
          return Promise.reject((e as Error).message)
        } else if (typeof(e) === 'string') {
          return Promise.reject(e)
        } else {
          return Promise.reject(e)
        }
      }

  },
  subscribe: function (key: string, channel: OnewayChannel, callback: (data: any) => void) {
    const subKey = getSubscribeKey(key, channel)
    if (subscribeMap.has(subKey)) return
    subscribeMap.set(subKey, 1)
    ipcRenderer.on(channel, (_event, data) => callback(data))
  },
  unsubscribeAll: function (channel:  OnewayChannel) {
    subscribeMap.clear()
    ipcRenderer.removeAllListeners(channel)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
