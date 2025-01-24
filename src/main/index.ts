import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  shell,
  Tray
} from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.ico?asset'
import { ProxyService } from '../share/ApplicationModels'
import { OnewayChannel } from '../share/InnerCommunication'
import { ServiceMgtRequest, ServiceOperation } from '../share/ServiceManagementContract'
import { ProxyServiceDao } from './dao/ProxyServiceDao'
import { ServiceGroupDao } from './dao/ServiceGroupDao'
import { UserRuntimeDao } from './dao/UserRuntimeDao'
import icon_status_down from './icons/status-down.ico?asset'
import icon_status_up from './icons/status-up.ico?asset'
import { DBManager } from './manager/DBManager'
import { ServiceManager } from './manager/ServiceManager'
import { ServiceClientInfo } from './microservice/Models'

const userRuntimeDao = new UserRuntimeDao()
const serviceGroupDao = new ServiceGroupDao()
const proxyServiceDao = new ProxyServiceDao()
const statusUpIcon = nativeImage.createFromPath(icon_status_up).resize({ width: 10 })
const statusDownIcon = nativeImage.createFromPath(icon_status_down).resize({ width: 10 })
let tray: Tray
let mainWindow: BrowserWindow
let serviceManager: ServiceManager

async function buildTrayMenu(): Promise<Menu> {
  const separator: MenuItemConstructorOptions = {
    type: 'separator'
  }
  const menu: MenuItemConstructorOptions[] = []
  let groupView: MenuItemConstructorOptions = {}
  let groupItems: MenuItemConstructorOptions[] = []
  let serviceItems: MenuItemConstructorOptions[] = []
  const runtimeInfo = await userRuntimeDao.findOne({})
  // 新用户
  if (!runtimeInfo || !runtimeInfo.selectedGroupId) {
    groupView = {
      label: '(no groups yet)',
      enabled: false
    }
    serviceItems.push({
      label: '(no services yet)',
      enabled: false
    })
  } else {
    // 组装groupView
    const groups = await serviceGroupDao.find({
      query: {},
      sort: { createTime: 1 }
    })
    const selectedGroup = groups.find((g) => g._id! === runtimeInfo.selectedGroupId)!
    groupView.label = selectedGroup.name
    groupItems = groups.map((g) => {
      return {
        id: '#group-' + g._id!,
        label: g.name,
        type: 'radio',
        checked: g._id! === runtimeInfo.selectedGroupId,
        click: (menuItem, _0, _1) => {
          const groupId = menuItem.id.replace('#group-', '')
          if (groupId === runtimeInfo.selectedGroupId) return
          // 1. 更新runtimeInfo数据库
          userRuntimeDao
            .updateOne({
              query: { _id: runtimeInfo._id! },
              update: { $set: { selectedGroupId: groupId } }
            })
            .then(() => {
              console.log('group change from ' + runtimeInfo.selectedGroupId + ' to ' + groupId)
              // 2. 通知render进程
              mainWindow.webContents.send(OnewayChannel.SelectGroupByTray, groupId)
            })
        }
      }
    })

    groupView.submenu = groupItems
    // 组装services
    const services: ProxyService[] = await proxyServiceDao.find({
      query: { groupId: selectedGroup._id! },
      sort: { createTime: -1 }
    })
    if (services.length === 0) {
      serviceItems.push({
        label: '(no services yet)',
        enabled: false
      })
    } else {
      // 查询client状态
      const clientInfos = (await serviceManager.handle({
        op: ServiceOperation.getProxyServiceStatus,
        serviceIds: services.map((s) => s._id!)
      })) as ServiceClientInfo[]
      const clientInfoMap = new Map(clientInfos.map((info) => [info.id, info.status]))
      serviceItems = services.map((s) => {
        const clientStatus = clientInfoMap.get(s._id!)

        // const warningIcon = nativeImage.cra
        let optionItems: MenuItemConstructorOptions[] = [
          {
            label: clientStatus === 'running' ? 'Stop' : 'Start',
            // type: 'checkbox',
            checked: clientStatus === 'running',
            click: (menuItem, _0, _1) => {
              console.log('checked value', menuItem.checked)
              const operation =
                clientStatus === 'running'
                  ? ServiceOperation.StopProxyService
                  : ServiceOperation.StartProxyService
              serviceManager
                .handle({
                  op: operation,
                  serviceId: s._id!
                } as ServiceMgtRequest)
                .then(() => console.log('enable by tray success'))
                .catch((e) => {
                  console.log('error occured: ', e)
                  tray.displayBalloon({
                    title: 'Error',
                    content: e,
                    largeIcon: false,
                    respectQuietTime: true
                  })
                })
            }
          }
        ]
        s.forwardConfigs!.forEach((c) => {
          const option = {
            id: c.key,
            label: c.key + ': ' + c.baseUrl,
            type: 'radio',
            checked: c.key === s.configKey!,
            click: (menuItem, _0, _1) => {
              if (s.configKey === menuItem.id) return
              // 2. 通知页面变更
              mainWindow.webContents.send(OnewayChannel.SelectConfigByTray, {
                groupId: s.groupId!,
                serviceId: s._id!,
                configKey: menuItem.id
              })
              // })
            }
          } as MenuItemConstructorOptions
          optionItems.push(option)
        })

        return {
          id: '#service-' + s._id!,
          label: s.instanceId,
          submenu: optionItems,
          icon: clientStatus === 'running' ? statusUpIcon : statusDownIcon
          // type:'checkbox',
          // checked: true
        } as MenuItemConstructorOptions
      })
    }
  }
  // 拼接所有
  // 1. groupview
  menu.push({
    label: '服务组',
    enabled: false
  })
  menu.push(groupView)
  menu.push(separator)
  // 2. services
  menu.push({
    label: '服务列表',
    enabled: false
  })
  serviceItems.forEach((si) => menu.push(si))
  menu.push(separator)
  // 3. about, quit
  menu.push({
    label: '关于',
    click: () => {
      shell.openExternal(
        'https://pacvue-enterprise.atlassian.net/wiki/spaces/~7120205530c95d6ebf48308c5630244e27517c/pages/302711362/Switch+Service'
      )
    }
  })
  menu.push({
    label: '退出',
    click: () => {
      app.quit()
    }
  })
  return Menu.buildFromTemplate(menu)
}
function createTray(): Tray {
  const theIcon = nativeImage.createFromPath(icon)
  const tray = new Tray(theIcon)
  tray.setToolTip('Switch Service')

  // tray.setContextMenu(trayMenu)
  tray.on('click', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.isVisible() ? mainWindow.setSkipTaskbar(false) : mainWindow.setSkipTaskbar(true)
  })
  tray.on('right-click', () => {
    buildTrayMenu().then((menu) => tray.popUpContextMenu(menu))
  })
  return tray
}

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.hide()
    mainWindow.setSkipTaskbar(true)
  })

  mainWindow.on('show', () => {})
  mainWindow.on('hide', () => {})

  mainWindow.webContents.setWindowOpenHandler((details) => {
    console.log('got url...' + details.url)
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  tray = createTray()
  mainWindow = createWindow()

  // trayWindow.show()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })
  ipcMain.on('window-min', () => mainWindow.minimize())
  ipcMain.on('window-max', () => (mainWindow.maximizable ? mainWindow.maximize() : () => {}))
  // 进程间通信manager初始化
  new DBManager(ipcMain).init()
  serviceManager = new ServiceManager(ipcMain, mainWindow.webContents)
  serviceManager.init()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('all window closed!')
    app.quit()
  }
})

app.on('before-quit', (_) => {
  console.log('before quit')
  mainWindow.removeAllListeners('close')
})

app.on('will-quit', (_) => {
  console.log('will-quit')
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
