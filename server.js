const express = require('express');
const app = express();
const port = 3000; // 您可以選擇任何未被使用的端口

// 將目錄設為靜態文件的服務目錄
app.use(express.static('public'));

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}/`);
});