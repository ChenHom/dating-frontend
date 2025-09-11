# ========================================
# 第一階段：基礎環境設置
# ========================================
FROM node:20-bullseye AS base

# 安裝系統依賴 (此層會被緩存)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 安裝全域工具 (此層會被緩存)
RUN npm install -g @expo/cli@latest \
    && npm cache clean --force

# 設定工作目錄
WORKDIR /app

# 建立非特權使用者
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# ========================================
# 第二階段：依賴安裝
# ========================================
FROM base AS dependencies

# 切換到非特權使用者
USER nextjs

# 只複製依賴文件 (變動較少，容易被緩存)
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs yarn.lock* ./

# 安裝生產依賴 (此層只有當 package.json/yarn.lock 變動時才重建)
RUN npm ci --omit=dev --no-audit \
    && npm cache clean --force

# ========================================
# 第三階段：應用程式構建
# ========================================
FROM dependencies AS builder

# 安裝所有依賴（包括開發依賴）用於構建
RUN npm ci --no-audit

# 複製應用程式源碼
COPY --chown=nextjs:nodejs . .

# 設定生產環境變數
ENV NODE_ENV=production \
    EXPO_NO_TELEMETRY=1

# 構建應用
RUN npx expo export --platform web --output-dir dist

# ========================================
# 第四階段：生產環境最終鏡像
# ========================================
FROM nginx:alpine AS production

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

# 從構建階段複製靜態文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製自定義 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 建立 nginx 運行所需的目錄
RUN mkdir -p /var/cache/nginx/client_temp \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# 切換到非特權使用者
USER nginx

# 暴露端口
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]