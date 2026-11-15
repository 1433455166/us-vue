import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import postcssPxToViewport from 'postcss-px-to-viewport'

// 后端地址统一读取 .env.development / .env.production 的 VITE_ADDRESS（单一数据源），
// 此处仅作兜底默认值；修改后端地址只需改对应 .env 文件
const FALLBACK_LOCAL = '192.168.31.39:731';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd());
    const BACKEND_ADDRESS = env.VITE_ADDRESS || FALLBACK_LOCAL;

    return {
    // 本地启动时由 dev server 直接托管 public 目录；打包时不复制 public（静态资源托管在远程服务器，见 src/utils/asset.js）
    publicDir: command === 'serve' ? 'public' : false,
    configureWebpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            // 生产环境：移除 vconsole
            config.externals = {
                'vconsole': 'VConsole'
            };
        }
    },
    plugins: [vue(), basicSsl()], // 自签证书：本地 HTTPS 测试（麦克风/WebRTC 等需要安全上下文）
    server: {
        proxy: {
            '/lzApi': {
                // 代理仅在本地 dev server 生效，始终指向本地后端
                target: `http://${BACKEND_ADDRESS}`,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/lzApi/, '')
            },
            '/chat': {
                // WebSocket 代理（仅 dev server 生效，线上由 nginx 反代 /chat）：
                // HTTPS 页面无法直连 ws:// 后端（混合内容拦截），
                // 前端连 wss://<dev 域名>/chat，由此转发到 Java 后端的 /chat 端点
                target: `ws://${BACKEND_ADDRESS}`,
                ws: true,
                changeOrigin: true
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
    };
})
