<template>
  <el-dialog v-model="dialogFormVisible" :title="title" :lock-scroll="false">
    <el-form ref="formRef" :model="formData" :rules="rules">
      <el-form-item label="组名" :label-width="formLabelWidth" prop="groupName">
        <el-input v-model="formData.groupName" autocomplete="off" clearable />
      </el-form-item>
      <el-form-item label="注册中心" :label-width="formLabelWidth" prop="registry">
        <el-select v-model="formData.registry" placeholder="注册中心">
          <el-option label="Eureka" value="Eureka" />
        </el-select>
        <!-- <el-button link>Test Connection</el-button> -->
      </el-form-item>
      <el-form-item label="Host" :label-width="formLabelWidth" prop="host">
        <el-input v-model="formData.host" autocomplete="off" clearable />
      </el-form-item>
      <template #prepend>Http://</template>
      <el-form-item label="Port" :label-width="formLabelWidth" prop="port">
        <el-input v-model.number="formData.port" autocomplete="off" type="number" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submit(formRef)"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { bus, BusEvent } from '@renderer/eventbus/eventbus'
import { onMounted } from 'vue'
import { FormInstance, FormRules } from 'element-plus'
import { useStore } from '@renderer/store/useStore'
import { RegistryType, ServiceGroup } from '@share/ApplicationModels'

interface FormData {
  groupId: string
  groupName?: string
  registry: string
  host: string
  port: number
}

const formRef = ref<FormInstance>()
const store = useStore()

const title = computed<string>(() => {
  if (!formData.groupId) return '新建'
  return '修改'
})
const dialogFormVisible = ref(false)
const formLabelWidth = '140px'
const formData = reactive<FormData>({
  groupId: '',
  groupName: '',
  registry: 'Eureka',
  host: '127.0.0.1',
  port: 8761
})

const rules = reactive<FormRules<FormData>>({
  groupName: [
    {
      validator: (_, value, callback) => {
        if (!value) {
          return callback(new Error('组名'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  host: [{ required: true, message: 'host', trigger: 'blur' }],
  port: [{ required: true, message: 'port', trigger: 'blur' }]
})

const resetFormData = (form: FormInstance | undefined) => {
  if (!form) return
  formData.groupId = ''
  formData.groupName = ''
  formData.host = '127.0.0.1'
  formData.port = 8761
  formData.registry = 'Eureka'
}

const setFormData = (group: ServiceGroup) => {
  formData.groupId = group._id!
  formData.groupName = group.name
  formData.registry = group.registry.type
  formData.host = group.registry.host
  formData.port = group.registry.port
}

onMounted(() => {
  bus.on(BusEvent.NewGroupDialog, () => {
    // 重置表单数据
    resetFormData(formRef.value)
    dialogFormVisible.value = true
  }),
    bus.on(BusEvent.EditGroupDialog, (groupId) => {
      // 1. 查询服务组信息
      store.findServiceGroup(groupId as string).then((group) => {
        // 2. 填充formData
        // 3. show
        setFormData(group)
        dialogFormVisible.value = true
      })
    })
})

const submit = function (form: FormInstance | undefined) {
  if (!form) return

  form.validate((valid, _) => {
    if (valid) {
      dialogFormVisible.value = false

      if (!formData.groupId) {
        // 创建
        store.createGroup({
          name: formData.groupName!,
          registry: {
            type: RegistryType.of(formData.registry),
            host: formData.host,
            port: formData.port
          }
        })
      } else {
        // 更新store
        store.updateGroup({
          _id: formData.groupId,
          name: formData.groupName!,
          registry: {
            type: RegistryType[formData.registry],
            host: formData.host,
            port: formData.port
          }
        })
        // 刷新dashboard
        if (store.isSelected(formData.groupId)) {
          bus.emit(BusEvent.RefreshServiceGroupDashBoard)
        }
      }
    }
  })
}
</script>
