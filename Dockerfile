# 使用 Node.js 18 作為基礎映像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製預構建的 dist 目錄
COPY dist/ ./dist/

# 複製伺服器文件
COPY server.js ./

# 暴露端口
EXPOSE 8080

# 設置環境變量
ENV NODE_ENV=production
ENV PORT=8080

# 啟動應用程序
CMD ["npm", "run", "start:production"]