import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
// 引入剩余的视图
import Emails from '../views/Emails.vue';
import Assets from '../views/Assets.vue';
import Mail from '../views/Mail.vue';
import Settings from '../views/Settings.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/emails', name: 'Emails', component: Emails },
  { path: '/assets', name: 'Assets', component: Assets },
  { path: '/mail', name: 'Mail', component: Mail },
  { path: '/settings', name: 'Settings', component: Settings },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;