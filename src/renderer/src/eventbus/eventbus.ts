import mitt from 'mitt'

export const bus = mitt()
export enum BusEvent {
    NewGroupDialog = 'NewGroupDialog',
    EditGroupDialog = 'EditGroupDialog',
    RefreshServiceGroupDashBoard = 'RefreshServiceGroupDashboard',
}