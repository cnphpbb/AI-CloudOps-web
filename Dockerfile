FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@10.13.1

# 复制所有源代码
COPY . .

# 清理可能存在的 node_modules
RUN rm -rf node_modules */node_modules */*/node_modules

# 安装依赖
RUN pnpm install

# 构建项目
RUN pnpm run build

FROM nginx:alpine AS production

# 安装 tzdata 用于时区设置
RUN apk add --no-cache tzdata

# 设置时区
ENV TZ=Asia/Shanghai

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

COPY --from=builder /app /opt

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 创建 nginx 运行所需的目录
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
