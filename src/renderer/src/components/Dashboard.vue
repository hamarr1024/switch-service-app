<template>
    <el-tabs tab-position="top" class="demo-tabs">
        <el-tab-pane >
            <template #label>
                <span class="custom-tabs-label">
                    <el-icon size="20"><svg-icon name="eureka" color="#515151" /></el-icon>
                    <span>Eureka</span>
                </span>
            </template>
            <!-- <RegistryPanel :groupId="groupId"/> -->
             <EurekaPanel />
        </el-tab-pane>
        <el-tab-pane >
            <template #label>
                <span class="custom-tabs-label">
                    <el-icon size="18"><svg-icon name="proxy" color="#515151" /></el-icon>
                    <span>Proxy</span>
                </span>
            </template>
            
            <ProxyPanel/>
        </el-tab-pane>
    </el-tabs>
</template>

<script lang="ts" setup>
import EurekaPanel from './EurekaPanel.vue';
import ProxyPanel from './ProxyPanel.vue';


// define props
// const props = defineProps<{
//     groupId?: string
// }>()


// 生命周期
// watch(()=>props.groupId, (oldVal, newVal) =>{
//     if (oldVal !== newVal) groupId.value = newVal
// })

</script>

<style>
.demo-tabs {
    height: 100%;
    /* padding-top: 10px; */
    /* padding-bottom: 10px; */
}

.demo-tabs>.el-tabs__content {
    /* background-color: bisque; */
    /* margin-bottom: 5px; */
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
}

.el-tabs--right .el-tabs__content,
.el-tabs--left .el-tabs__content {
    height: 100%;
}

.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}
.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}
</style>