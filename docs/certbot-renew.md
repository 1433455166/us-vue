# 证书续期记录（Let's Encrypt）

> Let's Encrypt 证书**有效期 90 天**，到期前需续期。
> 由于证书是在本地 Mac 上用 `--manual --preferred-challenges dns` 签发的，
> 服务器无法自动续期（出网受限），续期流程与签发流程基本一致：**Mac 重签 → 拷贝到服务器 → reload nginx**。

## 一、查看证书有效期

```bash
# 服务器上查看（任选其一）
openssl x509 -in /etc/nginx/certs/fullchain.pem -noout -dates
nginx -T 2>/dev/null | grep ssl_certificate   # 确认 nginx 引用的路径
```

- Let's Encrypt 会在到期前 30 天向签发时填写的邮箱发提醒邮件
- 浏览器访问站点时点击地址栏锁图标也可查看到期时间

## 二、手动续期（约 10 分钟一次，每 90 天一次）

### 1. Mac 上重新签发

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d www.<YOUR_DOMAIN> \
  -d <YOUR_DOMAIN>
```

流程与首次签发一致（见 `certbot-https.md`）：

1. 填邮箱（与首次相同可保持账户一致）→ 同意条款输入 `Y` → 回车
2. 按提示去 DNS 后台**更新两条 TXT 记录的值**（新值每次不同）：

| 主机记录 | 记录类型 | 新记录值 |
|---|---|---|
| `_acme-challenge` | TXT | 本次给根域的新值 |
| `_acme-challenge.www` | TXT | 本次给 www 的新值 |

3. 另开终端验证生效后再回车：

```bash
dig TXT _acme-challenge.www.<YOUR_DOMAIN> +short
dig TXT _acme-challenge.<YOUR_DOMAIN> +short
```

4. `Successfully received certificate` 即成功，本地 live 目录下的证书文件已自动更新。

### 2. 拷贝新证书到服务器

```bash
sudo scp /etc/letsencrypt/live/www.<YOUR_DOMAIN>/fullchain.pem \
         /etc/letsencrypt/live/www.<YOUR_DOMAIN>/privkey.pem \
         root@<SERVER_IP>:/etc/nginx/certs/
```

### 3. 服务器重载 nginx

```bash
ssh root@<SERVER_IP> "nginx -t && nginx -s reload"
```

### 4. 验证

浏览器访问 `https://www.<YOUR_DOMAIN>:<FRONTEND_PORT>`，查看证书有效期已更新；或：

```bash
openssl s_client -connect www.<YOUR_DOMAIN>:<FRONTEND_PORT> 2>/dev/null | openssl x509 -noout -dates
```

## 三、自动化续期（可选，推荐）

手动续期每 90 天一次容易忘，推荐改用支持 DNS API 的工具实现无人值守：

### 方案 A：acme.sh + 国内 DNS 插件（推荐）

```bash
# Mac 上安装（也可以装在任何能连 ACME 接口的机器上）
curl https://get.acme.sh | sh -s email=你的邮箱@example.com

# 以阿里云解析为例（腾讯云 DNSPod 用 export DP_Id/DP_Key，见 acme.sh dnsapi 目录）
export Ali_Key="xxx"      # DNS 服务商 API Key（RAM 子账号，只授权 DNS 权限）
export Ali_Secret="xxx"

# 签发（DNS API 自动添加/删除 TXT 记录）
~/.acme.sh/acme.sh --issue --dns dns_ali \
  -d www.<YOUR_DOMAIN> -d <YOUR_DOMAIN>

# 签发时直接输出到服务器部署目录（hook 自动 scp + reload）
~/.acme.sh/acme.sh --install-cert -d www.<YOUR_DOMAIN> \
  --fullchain-file /etc/nginx/certs/fullchain.pem \
  --key-file /etc/nginx/certs/privkey.pem \
  --reloadcmd "ssh root@<SERVER_IP> 'nginx -s reload'"

# acme.sh 安装时已自动写入 crontab，每 60 天自动续期，无需人工干预
```

- 腾讯云 DNSPod：`--dns dns_dp`，环境变量 `DP_Id` / `DP_Key`
- DNSPod Token 版：`--dns dns_dpod`，环境变量 `DP_Token`

### 方案 B：certbot + DNS API 插件

对应 pip 包：阿里云 `certbot-dns-aliyun`、DNSPod `certbot-dns-dnspod`，
配置 API 凭据后执行：

```bash
sudo certbot certonly --authenticator dns-aliyun --dns-aliyun-credentials ~/.secrets/aliyun.ini \
  -d www.<YOUR_DOMAIN> -d <YOUR_DOMAIN>
```

仍需自行处理「新证书拷贝到服务器 + reload」的环节（写脚本 + crontab）。

## 四、注意事项

- 续期时**只需更新 TXT 记录的值**，域名解析里的 A 记录等不要动
- certbot 手动模式续期会提示证书已存在，加 `--keep-until-expiring` 可避免误交互，
  或直接重跑同一条命令选择 R（Renew）
- 私钥文件（`privkey.pem`）泄露等于 HTTPS 失效，不要提交到任何仓库
- 若域名 DNS 服务商变更，自动续期的 API 插件也要同步更换
