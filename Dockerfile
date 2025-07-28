FROM node:23 AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && \
    pnpm pnpm config set registry https://registry.npmmirror.com && \
    pnpm install
RUN pnpm build:antd

FROM joseluisq/static-web-server:2.33-alpine

# 安装jq
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add jq

# 复制配置更新脚本
COPY scripts/deploy/update-config.sh /update-config.sh
RUN chmod +x /update-config.sh

# 复制构建产物
COPY --from=builder /app/apps/web-antd/dist /public

# 使用自定义entrypoint脚本
COPY scripts/deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
