# 部署设计（云服务器）

你提到服务器已有：

- 现有项目：`xiaolin-docs`
- 已使用：docker-compose / nginx / GitHub Actions
- 80 端口已被占用，且已配置 HTTPS

并且我已用 `gh` 查看到 `xiaolin-docs` 的部署风格是：

- CI：构建 Docker 镜像并推送到 **GHCR**（`ci-ghcr.yml`）
- CD：通过 **appleboy/ssh-action** 到服务器执行 `git pull` + `docker compose pull/down/up`（`cd-ghcr.yml`）

本项目按同样风格给出一套可复用的模板（见 `deploy/` 与 `.github/workflows/`）。

## 方案 1：静态文件部署（最简单）

### 服务器准备

1. 在服务器创建目录（示例）：
   - `/srv/undercover-game/current`（放 `dist/` 内容）
2. Nginx 增加一个 HTTPS 站点（示例）：
   - 使用新域名（推荐）：`undercover.example.com`
   - 或使用现有域名的子路径（可选）：`example.com/undercover/`

> 由于 80 端口已被占用，建议走 443 的 server block，并复用现有证书/或新增证书。

### GitHub Actions（部署思路）

- 触发：push 到 `main`
- 步骤：`pnpm install` → `pnpm build` → `rsync dist/` 到服务器目录 → `nginx -s reload`
- 需要的 Secrets：
  - `SSH_HOST` / `SSH_USER` / `SSH_KEY`（私钥）/ `SSH_PORT`（如有）/ `DEPLOY_PATH`

优点：最少组件；缺点：需要维护 nginx 静态目录与同步策略。

## 方案 2：Docker 部署（推荐，和现有 compose 更一致）

### 运行方式

1. GitHub Actions 构建 Docker 镜像并推送到 GHCR（或你的镜像仓库）
2. 服务器通过 `docker compose pull && docker compose up -d` 更新
3. Nginx 通过 443 反代到容器端口（容器对外不占用 80）

### Docker 镜像推荐做法

镜像内包含 `dist/`，用 nginx-alpine 或 caddy 静态服务：

- build stage：`pnpm build`
- runtime stage：nginx 提供静态文件

### docker-compose（示意）

```yaml
services:
  undercover-game:
    image: ghcr.io/<owner>/<repo>:main
    restart: unless-stopped
    ports:
      - "127.0.0.1:18082:80"
```

然后在 Nginx 里把子域名反代到 `127.0.0.1:18082`（通过 443）。

优点：版本化、回滚容易、和现有 compose/ci 一致；缺点：需要维护镜像发布与拉取权限。

## Nginx 设计建议（避免占用 80）

- 使用 **独立子域名**（推荐）：`undercover.example.com`
  - 好处：不需要处理 Vite 路由在子路径下的 base 问题
- 如果一定要用子路径（例如 `/undercover/`），需要：
  - Vite 配置 `base`
  - Nginx 做 `try_files` 处理 SPA 路由

## 落地步骤（按 xiaolin-docs 的习惯）

1. 在服务器创建目录：`~/WebstormProjects/undercover-game`
2. 在服务器 `git clone` 本仓库到该目录
3. 修改 `docker-compose.yml`：
   - 把 `ghcr.io/<OWNER>/<REPO>:main` 改成你的实际镜像地址（`<OWNER>/<REPO>` 就是本仓库的 `github.repository`）
4. Nginx 增加子域名站点，反代到 `127.0.0.1:18082`（示例见 `deploy/nginx/site-undercover-game.conf`）
5. GitHub 仓库 Secrets 增加（与 `xiaolin-docs` 一致）：
   - `SERVER_HOST`
   - `SERVER_USER`
   - `SERVER_PASSWORD`
6. 推送到 `main`，触发：
   - `.github/workflows/ci-ghcr.yml` 构建并推送镜像到 GHCR
   - `.github/workflows/cd-ghcr.yml` 登录服务器执行 `git pull` + `docker compose pull/down/up`

> 提示：若你更倾向用 SSH key 而非密码，我可以把 Actions 改成 key-based（更安全）。
