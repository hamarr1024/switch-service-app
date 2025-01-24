export interface StatusChangeInfo {
    serviceId: string,
    before: {
        status?: string
        errorMsg?: string
        lastStartTimestamp?:number
    },
    after: {
        status?: string
        errorMsg?: string
        lastStartTimestamp?:number
        lastRenewalTimestamp?:number
    }
}