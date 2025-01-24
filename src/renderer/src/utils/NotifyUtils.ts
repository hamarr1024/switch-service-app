import { ElNotification } from 'element-plus'

export class NotifyUtils {
  public static error(message: string, title?: string) {
    if (message.includes("Error invoking remote method 'ch-service-management': ")) {
      message = message.replace("Error invoking remote method 'ch-service-management': ", '')
    }
    ElNotification({
      title: title || 'Error',
      message: message,
      type: 'error'
    })
  }

  public static success(message: string, title?: string) {
    ElNotification({
      title: title || 'Success',
      message: message,
      type: 'success'
    })
  }

  public static warn(message: string, title?:string, useHtml?: boolean) {
    ElNotification({
      title: title || 'Warning',
      message: message,
      type: 'warning',
      dangerouslyUseHTMLString : useHtml
    })
  }
}
