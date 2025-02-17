import { createRouter, createWebHashHistory } from 'vue-router';
import Layout from '../views/Layout/index.vue';
import Home from '../views/Home/index.vue';
import Teams from '../views/Teams/index.vue';
import Players from '../views/Players/index.vue';
import Results from '../views/Results/index.vue';

const routes = [
  {
    path: '/',
    name: 'layout',
    component: Layout,
    children: [
      {
        path: '',
        name: 'home',
        component: Home,
      },
      {
        path: '/teams',
        name: 'teams',
        component: Teams,
      },
      {
        path: '/players',
        name: 'players',
        component: Players,
      },
      {
        path: '/results',
        name: 'results',
        component: Results,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
