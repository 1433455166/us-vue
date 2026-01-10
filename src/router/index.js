import { createRouter, createWebHashHistory } from "vue-router";

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
    },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
