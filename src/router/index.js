import { createRouter, createWebHashHistory } from "vue-router";
import { isMobileDevice } from "../utils/device";

const routes = [
    {
        path: "/",
        redirect: "/index",
    },
    {
        path: "/pc",
        name: "pc",
        component: () => import("../views/pc.vue"),
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
        path: '/chat',
        name: 'Chat',
        component: () => import("../views/Chat.vue"),
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
        path: '/lyrics',
        name: 'lyrics',
        component: () => import("../views/lyrics.vue"),
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

// 设备检测：PC 浏览器统一重定向到 PC 页面；
// 手机浏览器与 DevTools 移动设备模式（发送移动端 UA）可正常访问原页面
router.beforeEach((to) => {
  const mobile = isMobileDevice();
  if (!mobile && to.path !== "/pc") {
    return "/pc";
  }
  if (mobile && to.path === "/pc") {
    return "/index";
  }
});

export default router;