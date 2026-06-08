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
    {
        path: "/novel",
        component: () => import("../views/novel.vue"),
    },
    {
        path: '/bookList',
        name: 'bookList',
        component: () => import("../views/noveList.vue"),
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
        path: '/music',
        name: 'music',
        component: () => import("../views/music.vue"),
    },
    {
        path: '/musicList',
        name: 'musicList',
        component: () => import("../views/musicList.vue"),
    },
    {
        path: '/test',
        name: 'test',
        component: () => import("../views/test.vue"),
    },
    {
        path: '/declaration',
        name: 'declaration',
        component: () => import("../views/declaration.vue"),
    },
    {
        path: '/game/multiplicationTable',
        name: 'multiplicationTable',
        component: () => import("../views/game/multiplicationTable.vue"),
    }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;