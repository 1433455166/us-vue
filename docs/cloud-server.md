# 云服务器配置记录

> 以下 `<SERVER_IP>`、`<BACKEND_PORT>` 等为占位符，实际值见内部运维记录，请勿提交真实 IP/端口到公开仓库。

## 服务器信息

| 项 | 值 |
|---|---|
| 服务器 IP | `<SERVER_IP>` |
| 站点端口（前端） | `9527` |
| 后端接口端口 | `<BACKEND_PORT>` |
| 静态资源目录（服务器） | `/data/static-resources/` |
| 前端部署目录 | `/www/wwwroot/dist` |
| nginx 配置文件 | `/etc/nginx/sites-available/dist.conf` |

## 部署方式

服务器上**不需要编译**，本地打包后上传 `dist` 产物即可：

```bash
# 本地执行
npm run build

# 将 dist 目录内容上传到服务器 /www/wwwroot/dist（scp / ftp / 宝塔均可）
scp -r dist/* user@<SERVER_IP>:/www/wwwroot/dist/
```

> 注意：`vite.config.js` 已配置 `publicDir: false`，打包产物不包含 public 目录。
> 图片、音频、歌词等静态资源统一托管在服务器 `/data/static-resources/`，
> 通过 `http://<SERVER_IP>:<ASSET_PORT>/static/` 访问，与 public 目录内容保持同步（见 `src/utils/asset.js`）。

## nginx 配置（/etc/nginx/sites-available/dist.conf）

```nginx
server {
    listen 9527;
    server_name <SERVER_IP>;

    root /www/wwwroot/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端接口反向代理：/lzApi/ -> 后端服务，末尾 / 会去掉 /lzApi 前缀（等同 vite 的 rewrite）
    location /lzApi/ {
        proxy_pass http://<BACKEND_HOST>:<BACKEND_PORT>/;
        proxy_set_header Host $host;
    }

    # 独立资源服务：/static/ -> /data/static-resources/
    location /static/ {
        alias /data/static-resources/;   # 末尾斜杠必须有
        autoindex off;
        expires 30d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
        try_files $uri =404;
    }
}
```

修改配置后重载：

```bash
nginx -t && nginx -s reload
```

## 接口与跨域说明

- 前端请求走同源相对路径 `/lzApi/...`（`src/utils/request.js` 中 `API_BASE_URL = ''`），
  由 nginx 反向代理转发到后端服务，不存在浏览器跨域问题
- `proxy_pass` 末尾的 `/` 必须保留：开发环境 Vite 代理会 `rewrite` 去掉 `/lzApi` 前缀，
  线上 nginx 依靠结尾斜杠实现同样的前缀剥离，否则后端收到 `/lzApi/...` 会返回 404

## 相关代码位置

| 文件 | 作用 |
|---|---|
| `src/utils/asset.js` | 静态资源 URL 拼接（`getAssetUrl`），基础地址可用 `VITE_ASSET_BASE` 覆盖 |
| `src/utils/request.js` | 接口请求，`API_BASE_URL` 为空串走同源代理 |
| `src/common/enum.ts` | 后端 `ADDRESS`（仅开发环境 Vite 代理使用） |
| `vite.config.js` | `publicDir: false`、开发代理 `/lzApi` |
