<template>
    <el-dialog v-model="dialogFormVisible" width="550" :title="title" :lock-scroll="false" :before-close="onCancel">
        <el-form ref="formRef" :model="formData" :rules="rules">
            <el-form-item label="InstanceId" :label-width="formLabelWidth" style="width: 600px" prop="instanceId">
                <el-text>ss-proxy@</el-text>
                <el-input v-model="formData.serviceName" style="width: 120px; margin-left: 5px" disabled />
                <el-text style="margin-left: 5px">{{ `@${formData.host}:` }}</el-text>
                <el-input v-model="formData.port" style="width: 80px; margin-left: 5px" disabled />
            </el-form-item>
            <el-form-item label="Service" :label-width="formLabelWidth" prop="serviceName">
                <el-input v-model="formData.serviceName" autocomplete="off" style="width: 200px" clearable />
            </el-form-item>
            <el-form-item label="Host" :label-width="formLabelWidth" prop="host">
                <el-text>{{ formData.host }}</el-text>
            </el-form-item>
            <!-- <template #prepend>Http://</template> -->
            <el-form-item label="Port" :label-width="formLabelWidth" prop="port">
                <el-input v-model.number="formData.port" autocomplete="off" style="width: 100px" type="number"
                    clearable />
                <el-button-group style="margin-left: 5px">
                    <!-- <el-button type="primary" link>check</el-button> -->
                    <el-button text link @click="generateRandomPort()"><svg-icon name="sieve" color="#1296db"
                            size="20px" /></el-button>
                    <el-text>(18000~19000)</el-text>
                </el-button-group>
            </el-form-item>
            <el-form-item label="Forward Configs" :label-width="formLabelWidth" style="width: 600px">
                <el-text style="margin-right: 5px">key</el-text><el-input v-model="forwardOptionData.key"
                    style="width: 80px" />
                <el-text style="margin-right: 5px; margin-left: 10px">url</el-text><el-input
                    v-model="forwardOptionData.baseUrl" style="width: 200px" />
                <!-- <el-text style="margin-right: 5px;">备注</el-text><el-input v-model="forwardOptionData.comment" style="width: 80px;"/> -->
                <el-button type="primary" :icon="CirclePlus" @click="addForwardOption()"
                    :disabled="!isAddForwardOptionAvailable" size="large" style="margin-left: 5px" link />
            </el-form-item>
            <el-form-item v-for="option in formData.forwardOptions" :label-width="formLabelWidth">
                <el-text style="margin-right: 5px">key</el-text><el-input v-model="option.key" style="width: 80px"
                    disabled />
                <el-text style="margin-right: 5px; margin-left: 10px">url</el-text><el-input v-model="option.baseUrl"
                    style="width: 200px" />
                <el-button type="danger" :icon="Remove" @click="deleteForwardOption(option.key)" size="large"
                    style="margin-left: 5px" link />
            </el-form-item>
            <el-form-item v-model="formData.forwardOptions" :label-width="formLabelWidth" prop="forwardOptions">
            </el-form-item>


        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="onCancel()">取消</el-button>
                <el-button type="primary" @click="onConfirm(formRef)"> 确认 </el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { CirclePlus, Remove } from '@element-plus/icons-vue'
import { ProxyService } from '@share/ApplicationModels'
import NumberUtils from '@share/utils/NumberUtils'
import { FormInstance, FormRules } from 'element-plus'
import { computed, reactive, ref, toRaw, watch } from 'vue'

interface ForwardOption {
    key: string
    baseUrl: string
    //   comment: string
}

interface FormData {
    instanceId: string// 实例id
    serviceId: string //服务id
    serviceName: string // 服务名
    host: string
    port: number // 实例实例
    forwardOptions: ForwardOption[],
    configKey: string
}

const props = defineProps<{
    serviceId: string
    serviceData?: ProxyService
    visible: boolean
}>()
const emit = defineEmits(['cancel', 'confirm'])

const formRef = ref<FormInstance>()

const title = computed<string>(() => {
    if (!props.serviceId) return '新增服务实例'
    return '修改服务实例(' + props.serviceId + ')'
})

const dialogFormVisible = ref(false)
const formLabelWidth = '120px'
const formDataEmpty = {
    instanceId: '',
    serviceId: '', // 唯一标识，db id
    serviceName: '', // 服务名
    host: '127.0.0.1',
    port: 18000, // 实例实例
    forwardOptions: [] as ForwardOption[],
    configKey: ''
}
const forwardOptionDataEmpty =
{
    key: '',
    baseUrl: ''
}
const formData = ref(Object.assign({}, formDataEmpty))
const forwardOptionData = ref(Object.assign({}, forwardOptionDataEmpty))

const isAddForwardOptionAvailable = computed(() => {
    return (
        forwardOptionData.value.key &&
        forwardOptionData.value.key.trim() !== '' &&
        forwardOptionData.value.baseUrl &&
        forwardOptionData.value.baseUrl.trim() !== ''
    )
})

const rules = reactive<FormRules<FormData>>({
    serviceName: [
        {
            validator: (_, value, callback) => {
                if (!value) {
                    return callback(new Error('service name is null'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    host: [{ required: true, message: 'host is null', trigger: 'blur' }],
    port: [{ required: true, message: 'port is null', trigger: 'blur' }],
    forwardOptions: [
        {
            validator: (_, value, callback) => {
                // console.log('validate options,', toRaw(value))
                if (!value || toRaw(value).length <= 0) {
                    return callback(new Error('at least 1 forward config is required'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ]
})

// hook
watch(
    () => props.visible,
    (newVal, _) => {
        dialogFormVisible.value = newVal
    }
)
watch(() => props.serviceId, (newVal, _) => {
    if (!newVal) {
        resetFormData()
        generateRandomPort()
    } else {
        // console.log('to edit', props.serviceData)
        const data = props.serviceData!
        formData.value.serviceId = data._id!
        formData.value.serviceName = data.serviceName
        formData.value.host = data.host
        formData.value.port = data.port
        formData.value.instanceId = data.instanceId
        formData.value.forwardOptions = data.forwardConfigs!.map(c => {
            return {
                key: c.key,
                baseUrl: c.baseUrl
            }
        })
        formData.value.configKey = data.configKey || ''
    }
})

// functions
// instanceId:'',
//     serviceId: '', // 唯一标识，db id
//     serviceName: '', // 服务名
//     host: '127.0.0.1',
//     port: 18000, // 实例实例
//     forwardOptions: [] as ForwardOption[]
const resetFormData = () => {
    formData.value.instanceId = ''
    formData.value.serviceId = ''
    formData.value.serviceName = ''
    formData.value.host = '127.0.0.1'
    formData.value.port = 18000
    formData.value.forwardOptions = [] as ForwardOption[]
    formData.value.configKey = ''

    forwardOptionData.value.key = ''
    forwardOptionData.value.baseUrl = ''
}
const onCancel = () => {
    resetFormData()
    emit('cancel')
}
const onConfirm = (form: FormInstance | undefined) => {
    if (!form) return
    form.validate((valid, _) => {
        if (valid) {
            const data = {} as FormData
            data.serviceId = formData.value.serviceId
            data.instanceId = formData.value.instanceId
            data.host = formData.value.host
            data.port = formData.value.port
            data.serviceName = formData.value.serviceName
            data.forwardOptions = formData.value.forwardOptions.map(o => {
                return {
                    key: o.key,
                    baseUrl: o.baseUrl
                } as ForwardOption
            })
            if (data.forwardOptions.find(o => o.key === formData.value.configKey)) {
                data.configKey = formData.value.configKey
            } else {
                data.configKey = data.forwardOptions[0].key
            }
            emit('confirm', data)
            resetFormData()
        }
    })
}

const generateRandomPort = () => {
    formData.value.port = NumberUtils.randomInt(18000, 19000)
}

const addForwardOption = () => {
    const option: ForwardOption = {
        key: forwardOptionData.value.key,
        baseUrl: forwardOptionData.value.baseUrl
    }
    formData.value.forwardOptions.push(option)
    forwardOptionData.value.key = ''
    forwardOptionData.value.baseUrl = ''
}

const deleteForwardOption = (key) => {
    formData.value.forwardOptions = formData.value.forwardOptions.filter((opt) => opt.key != key)
}
</script>
