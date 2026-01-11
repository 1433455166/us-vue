import { createRouter, createWebHashHistory } from "vue-router";
import { passwordGuard } from './guards';

const routes = [
    {
        path: "/",
        redirect: "/index",
    },
    {
        path: "/index",
        component: () => import("../views/index.vue"),
    },
    {
        path: "/love",
        component: () => import("../views/love.vue"),
        beforeEnter: passwordGuard,
    },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
