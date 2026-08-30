import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
// 确保您已经将原型 HTML 中的所有 CSS 放到了这个文件中
import './assets/style.css' 

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')