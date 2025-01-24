import Home from "@renderer/views/Home.vue"
import {createRouter, createWebHashHistory} from "vue-router"

export default createRouter({
    history: createWebHashHistory(), // hash模式
    routes:[
        {
            path: "/",
            component: Home
        }
    ]
})