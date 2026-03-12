# 使用官方 Node.js 作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /woof

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件和文件夹到工作目录
COPY . .

# 应用监听的端口
EXPOSE 3000

# 启动 Node.js 服务器
CMD ["node", "server.js"]
