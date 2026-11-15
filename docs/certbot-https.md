# HTTPS 证书签发记录（Let's Encrypt / certbot）

> 域名：`<YOUR_DOMAIN>`（已解析到云服务器，例：`www.example.top`）
> 目的：前端页面启用 HTTPS 后，麦克风 / WebRTC（五子棋语音通话）才能使用。
> 服务器出网受限（连不上 Let's Encrypt 接口），因此**证书在本地 Mac 上签发，再拷贝到服务器**。

## 背景

- `getUserMedia`（麦克风）只在安全上下文（HTTPS / localhost）可用，HTTP 部署的线上站点无法使用语音
- 裸 IP 无法申请 Let's Encrypt 证书（只颁发给域名），自签证书浏览器会拦截敏感权限 → 必须用域名 + 正规证书
- 云服务器 `curl https://acme-v02.api.letsencrypt.org/directory` 超时（IPv4 连不上 Cloudflare、无 IPv6 出口），无法在服务器上签发
- 80 端口不通也没关系：使用 **DNS-01 验证**（加 TXT 记录证明域名所有权），不需要开放任何端口

## 一、本地 Mac 安装 certbot

brew / ghcr.io 网络不通，用 pip + 清华镜像安装：

```bash
python3 -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple certbot
# 若提示 externally-managed-environment，加 --break-system-packages 重跑
# 验证
certbot --version
```

## 二、签发证书（手动 DNS 验证）

```bash
sudo $(which certbot) certonly --manual --preferred-challenges dns \
  -d www.<YOUR_DOMAIN> \
  -d <YOUR_DOMAIN>
```

交互流程与注意点：

1. 邮箱：随意填写（仅用于过期提醒），回车跳过也可
2. 服务条款：输入 `Y`（**不要输 c，c 是取消**）
3. EFF 邮件订阅：随意（Y/N）
4. certbot 会依次给出 **两个域名的 TXT 记录值**，在 DNS 后台添加两条记录：

| 主机记录 | 记录类型 | 记录值 |
|---|---|---|
| `_acme-challenge` | TXT | certbot 给根域的值 |
| `_acme-challenge.www` | TXT | certbot 给 www 的值 |

> 注意：主机记录只填前缀（控制台自动补全域名后缀）；两个值是两条不同的记录，勿混淆。

5. **先验证 DNS 生效，再回车继续**（另开终端）：

```bash
dig TXT _acme-challenge.www.<YOUR_DOMAIN> +short
dig TXT _acme-challenge.<YOUR_DOMAIN> +short
```

能看到对应值后再回车，输出 `Successfully received certificate` 即成功。

## 三、证书位置与拷贝到服务器

```
/etc/letsencrypt/live/www.<YOUR_DOMAIN>/fullchain.pem   # 证书
/etc/letsencrypt/live/www.<YOUR_DOMAIN>/privkey.pem     # 私钥
```

文件说明（live 目录下共 4 个文件，nginx 只需前两个）：

| 文件 | 用途 |
|---|---|
| `fullchain.pem` | 证书链（含中间证书，nginx 用这个） |
| `privkey.pem` | 私钥（nginx 用这个，保密，勿提交仓库） |
| `cert.pem` | 仅服务器证书（不含中间证书，一般不用） |
| `chain.pem` | 中间证书链 |

> `live/` 下是软链接，真实文件在 `/etc/letsencrypt/archive/<YOUR_DOMAIN>/` 里，操作时始终用 live 路径。

### 在 Mac 上查看/打开证书

`live` 目录权限仅 root 可读，Finder 直接打开会提示无权限，常用三种方式：

```bash
# 方式 1：终端查看（推荐）
sudo ls -l /etc/letsencrypt/live/www.<YOUR_DOMAIN>/
# 查看证书有效期、域名等信息
sudo openssl x509 -in /etc/letsencrypt/live/www.<YOUR_DOMAIN>/fullchain.pem -noout -dates -subject

# 方式 2：Finder 前往（Cmd+Shift+G 输入路径，仅能浏览，可能无权限打开内容）
# /etc/letsencrypt/live/www.<YOUR_DOMAIN>/

# 方式 3：拷贝到桌面后用 Finder 打开（可双击 pem 文件唤起钥匙串查看详情）
mkdir -p ~/Desktop/certs
sudo cp /etc/letsencrypt/live/www.<YOUR_DOMAIN>/fullchain.pem \
        /etc/letsencrypt/live/www.<YOUR_DOMAIN>/privkey.pem \
        ~/Desktop/certs/
sudo chown -R $(whoami) ~/Desktop/certs
open ~/Desktop/certs
```

> 注意：`privkey.pem` 是私钥，查看完建议删除桌面副本，不要长期留在本地或提交到任何仓库。

### 本地 vite 自签证书（@vitejs/plugin-basic-ssl）

本地 HTTPS 测试用的自签证书缓存在项目内（不影响部署）：

```bash
ls node_modules/.vite/basic-ssl/    # cert.pem / key.pem，删除 node_modules 后自动重新生成

# 如需导出发给手机安装信任（iOS 安装后还需在
# 「设置 → 通用 → 关于本机 → 证书信任设置」开启完全信任）
cp node_modules/.vite/basic-ssl/cert.pem ~/Desktop/local-dev-cert.cer
```

```bash
# 服务器上建目录
ssh root@<SERVER_IP> "mkdir -p /etc/nginx/certs"

# Mac 上拷贝（live 目录需 sudo 读取）
sudo scp /etc/letsencrypt/live/www.<YOUR_DOMAIN>/fullchain.pem \
         /etc/letsencrypt/live/www.<YOUR_DOMAIN>/privkey.pem \
         root@<SERVER_IP>:/etc/nginx/certs/
```

## 四、服务器 nginx 启用 HTTPS

```nginx
server {
    listen <FRONTEND_PORT> ssl;
    server_name www.<YOUR_DOMAIN>;
    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    root /www/wwwroot/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }

    # 普通 HTTP 接口（/lzApi/login → Java /login，与 vite dev 代理行为一致）
    location /lzApi/ {
        proxy_pass http://127.0.0.1:<BACKEND_PORT>/;
        proxy_set_header Host $host;
    }

    # WebSocket 信令（聊天室 + 五子棋联机/语音）
    location /chat {
        proxy_pass http://127.0.0.1:<BACKEND_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

生效：`nginx -t && nginx -s reload`

## 五、前端配套改动（已完成）

- HTTPS 页面禁止直连 `ws://` 后端（混合内容拦截），五子棋（`useOnlineGame.js`）与聊天室（`Chat.vue`）
  在 HTTPS 环境下自动改连 `wss://<当前域名>/chat`（走上面的 nginx 反代），HTTP 环境仍直连 `ADDRESS/chat`
- vite 开发环境用 `@vitejs/plugin-basic-ssl` 本地模拟 HTTPS（自签证书，仅本地测试用）

## 六、访问验证

`https://www.<YOUR_DOMAIN>:<FRONTEND_PORT>/#/game/gomoku`
- 正规证书无浏览器警告
- 联机对局中「🎙️ 语音」按钮 → 麦克风授权正常 → WebRTC 接通
- 跨网络语音走公共 STUN（`stun.l.google.com:19302`）穿透，普通 NAT 可用；严格对称 NAT 需自建 TURN（暂未配置）
