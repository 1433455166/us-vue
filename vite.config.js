import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import postcssPxToViewport from 'postcss-px-to-viewport'

// const address = `${window.location.protocol}//${window.location.hostname}:731` // 本地
// const address = 'http://localhost:731' // 本地
const address = 'http://154.64.235.142:731'; // 线上环境

// https://vite.dev/config/
export default defineConfig({
    configureWebpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            // 生产环境：移除 vconsole
            config.externals = {
                'vconsole': 'VConsole'
            };
        }
    },
    plugins: [vue()],
    server: {
        proxy: {
            '/lzApi': {
                target: address,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/lzApi/, '')
            }
        },
        host: '0.0.0.0', // 允许外部访问
        port: 9527,      // 你可以自定义端口，默认是 3000
        open: true       // 可选：启动时自动打开浏览器
    },
    css: {
    postcss: {
      plugins: [
        postcssPxToViewport({
          viewportWidth: 750, // 设计稿宽度
          unitToConvert: 'lpx', // 要转换的单位
          viewportUnit: 'vw', // 转换后的单位
          fontViewportUnit: 'vw', // 字体转换单位
          unitPrecision: 5, // 转换精度
          minPixelValue: 1, // 最小转换值
          mediaQuery: false, // 媒体查询中的单位是否转换
          selectorBlackList: [], // 忽略的选择器
          exclude: /node_modules/ // 排除目录
        })
      ]
    }
  }
})
