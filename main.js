const { app, BrowserWindow } = require('electron');

function createWindow() {
  // 創建一個新的瀏覽器窗口
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // 加載應用的 index.html
  win.loadFile('index.html');
}

// Electron 將在初始化完成並準備創建瀏覽器窗口時調用此方法
app.whenReady().then(createWindow);

// 關閉所有窗口時退出應用（在 macOS 上除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在 macOS 上，當點擊 dock 圖標並且沒有其他窗口打開時，通常會在應用中重新創建一個窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
