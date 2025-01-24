export interface EurekaAppsResponse {
  applications: {
    versions__delta: string
    apps__hashcode: string
    application: Application[]
  }
}

export interface Application {
  name: string
  instance: Instance[]
}

export interface Instance {
  instanceId: string
  hostName:string
  app: string
  status: string
  port: Port
  securePort: Port
  leaseInfo: LeaseInfo
  metadata: MetaData
  homePageUrl: string
  statusPageUrl: string
  healthCheckUrl: string
  vipAddress: string
  secureVipAddress: string
  isCoordinatingDiscoveryServer: string
  lastUpdatedTimestamp: string
  lastDirtyTimestamp: string
  actionType: string
}
export interface Port {
  $: number
  '@enabled': number
}
export interface LeaseInfo {
  renewalIntervalInSecs: number
  durationInSecs: number
  registrationTimestamp: number
  lastRenewalTimestamp: number
  evictionTimestamp: number
  serviceUpTimestamp: number
}
export interface MetaData {
  'management.port': string
  'jmx.port': string
}
