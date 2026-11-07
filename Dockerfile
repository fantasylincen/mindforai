# 构建 MindForAI 的前端静态资源
FROM node:20 AS builder

WORKDIR /builder

COPY . /builder

RUN npm ci \
    && npx nx build web

# 使用静态站点镜像承载构建产物
FROM lipanski/docker-static-website:2.6.0

WORKDIR /home/static

COPY --from=builder /builder/dist/apps/web/ /home/static

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=12 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["/busybox-httpd","-f","-v","-p","80","-c","httpd.conf"]
