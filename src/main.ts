import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './style.css'
import './utils/flexible.js';

import App from './App.vue'

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount('#app');

