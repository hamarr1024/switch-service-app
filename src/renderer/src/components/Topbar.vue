<template>
    <div class="tb_container">
        <div class="tb_left">
            <el-button-group>
                <el-button :icon="runtimeInfo.folded? Expand : Fold" class="tb_btn" size="large" text @click="onFold()"/>
                <el-button :icon="Plus" class="tb_btn" size="large" text @click="openNewGroupDialog()" />
            </el-button-group>

        </div>
        <div class="tb_mid" style="color: black;">
            <div class="tb_mid_content"><span>{{ title }}</span></div>
        </div>
        <div class="tb_right">
            <el-button-group>
                <el-button :icon="Minus" class="tb_btn" size="large" text @click="minimize" />
                <!-- <el-button :icon="TopRight" class="tb_btn" size="large" text/> -->
                <el-button :icon="Close" class="tb_btn" size="large" text @click="close" />
            </el-button-group>

        </div>
    </div>
</template>
<script setup lang="ts">
import { Close, Fold, Expand,  Minus, Plus } from '@element-plus/icons-vue';
import {bus, BusEvent} from '@renderer/eventbus/eventbus'
import { useStore } from '@renderer/store/useStore';
import { storeToRefs } from 'pinia';

defineProps<{
    title?: string
}>()

const emit = defineEmits(['fold'])

const store = useStore()
const {runtimeInfo} = storeToRefs(store)

function close() {
    window.electron.ipcRenderer.send('window-close')
}
function minimize() {
    window.electron.ipcRenderer.send('window-min')
}
// function maximize() {
//     window.electron.ipcRenderer.send('window-max')
// }

const openNewGroupDialog = () => {
    bus.emit(BusEvent.NewGroupDialog)
}

const onFold = () => {
    emit('fold')
}




</script>
<style lang="scss">
.tb_container {

    display: flex;
    // flex-wrap: wrap;
    justify-content: space-between;
}

.tb_left {
    // padding-left: 15px;
    // flex: 0 0 20%;
    height: 100%;
    width: 120px;
}

.tb_mid {
    -webkit-app-region: drag;
    flex: 1;
    height: 100%;
}

.tb_mid_content {
    height: 100%;
    display: flex;
    /**/
    justify-content: center;
    /*水平居中*/
    align-items: Center;
    /*垂直居中*/
}

.tb_right {
    // flex: 0 0 20%;
    display: flex;
    justify-content: right;
    // float: right;
    height: 100%;
    width: 120px;
}

// .tb_btn {
//     // margin-left: 2px;
//     // margin-right: 2px;
//     color: black;
//     height: 100%;
//     width: 40px;

// }
</style>
