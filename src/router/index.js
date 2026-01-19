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
    {
        path: "/novel",
        component: () => import("../views/novel.vue"),
        beforeEnter: passwordGuard,
    },
    {
        path: '/bookList',
        name: 'bookList',
        component: () => import("../views/noveList.vue"),
        beforeEnter: passwordGuard,
    },
    {
        path: '/reader/:id',
        name: 'Reader',
        component: () => import("../views/reader.vue"),
    },
    {
        path: '/book/:id',
        name: 'Book',
        component: () => import("../views/reader.vue"),
    },
    {
        path: '/test',
        name: 'test',
        component: () => import("../views/test.vue"),
    }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
