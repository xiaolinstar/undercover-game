import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/setup',
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/SetupView.vue'),
    },
    {
      path: '/words',
      name: 'words',
      component: () => import('../views/WordPairPickerView.vue'),
    },
    {
      path: '/deal',
      redirect: '/reveal/1',
    },
    {
      path: '/reveal/:pos',
      name: 'reveal',
      component: () => import('../views/RevealView.vue'),
    },
    {
      path: '/host',
      name: 'host',
      component: () => import('../views/HostView.vue'),
    },
  ],
})

export default router
