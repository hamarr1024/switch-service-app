import { ElMessage } from "element-plus"

export default class MessageService {

    public static success = (msg: string) => {
        ElMessage({
            message: msg,
            type: 'success',
          })
    }

    public static error = (msg: string) => {
        ElMessage({
            message: msg,
            type: 'error',
          })
    }
}
