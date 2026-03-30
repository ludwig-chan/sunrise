import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CharacterProfileView from '../views/CharacterProfileView.vue'
import CharacterEquipmentView from '../views/CharacterEquipmentView.vue'
import SettingsView from '../views/SettingsView.vue'
import FeedView from '../views/FeedView.vue'
import LogsView from '../views/LogsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/character',
      redirect: '/character/profile',
    },
    {
      path: '/character/profile',
      name: 'character-profile',
      component: CharacterProfileView,
    },
    {
      path: '/character/equipment',
      name: 'character-equipment',
      component: CharacterEquipmentView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/feed',
      name: 'feed',
      component: FeedView,
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogsView,
    },
  ],
})

export default router
