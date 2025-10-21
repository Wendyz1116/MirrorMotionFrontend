import { createApp } from 'vue';
import App from './App.vue';
// import router from './router';
import axios from 'axios';

const app = createApp(App);

app.config.globalProperties.$axios = axios; // Vue 3 equivalent of Vue.prototype.$axios
// app.use(router);
app.mount('#app');