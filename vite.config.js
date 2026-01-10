import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const address = 'http://192.168.31.173:731';

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
    }
})
