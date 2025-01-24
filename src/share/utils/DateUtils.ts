
export default class DetaUtils {
    public static formatDate(date: Date) {
        let d = new Date(date),
            year = d.getFullYear(),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            hour = '' + d.getHours(),
            minute = '' + d.getMinutes(),
            seconds = '' + d.getSeconds(),
            milliSeconds = '' + d.getMilliseconds()

            if (month.length < 2) {
                month = '0' + month
            }
            if (day.length < 2) {
                day = '0' + day
            }
            if (hour.length < 2) {
                hour = '0' + hour
            }
            if (minute.length < 2) {
                minute= '0' + minute
            }
            if (seconds.length<2) {
                seconds = '0' + seconds
            }
            if (milliSeconds.length < 2) {
                milliSeconds = '00' + milliSeconds
            } else if (milliSeconds.length < 3) {
                milliSeconds = '0' + milliSeconds
            }

            return `${year}-${month}-${day} ${hour}:${minute}:${seconds}.${milliSeconds}`
    }
}