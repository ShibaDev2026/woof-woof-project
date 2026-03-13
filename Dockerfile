# 使用官方 Node.js 20 alpine 映像檔（alpine 體積小、攻擊面小）
FROM node:20-alpine

# 設定工作目錄
WORKDIR /woof

# 複製套件清單並安裝依賴
COPY package*.json ./
RUN npm install

# 複製專案檔案
COPY . .

# 建立低權限使用者，避免 container 以 root 身分執行
RUN addgroup -S woof && adduser -S woof -G woof

# 將專案目錄擁有者改為低權限使用者
RUN chown -R woof:woof /woof

# 切換為低權限使用者
USER woof

# 開放應用程式監聽的 port
EXPOSE 3000

# 啟動 Node.js 伺服器
CMD ["node", "server.js"]
