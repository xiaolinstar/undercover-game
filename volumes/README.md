# volumes

该目录用于存放需要通过 Docker 挂载（bind mount / volume）到容器内的文件或数据。

建议按用途分子目录，例如：

- `volumes/nginx/`：自定义 Nginx 配置、证书（如需）
- `volumes/data/`：应用运行时需要持久化的数据（本项目当前为纯静态站，一般不需要）
- `volumes/cert/`：证书文件（如 Let's Encrypt）
