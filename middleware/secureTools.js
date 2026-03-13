const { execFile } = require('child_process');

// ─── OWASP 安全工具模組 ────────────────────────────────────────────────────────
// 集中管理所有 OWASP 相關防護邏輯，新增防護只需在此擴充，不影響業務邏輯

/**
 * 驗證動物 id 格式
 * 防護目標：A01 Path Traversal、A03 Shell Injection
 * 規則：只允許小寫英數字、底線、連字號（例：cat、woof_dog、my-animal）
 * @param {string} id
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateAnimalId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, reason: 'id 必填' };
  }
  if (!/^[a-z0-9_-]+$/.test(id)) {
    return { valid: false, reason: 'id 只允許小寫英數字、底線、連字號' };
  }
  return { valid: true };
}

/**
 * 安全執行外部程式
 * 防護目標：A03 Shell Injection
 * 使用 execFile 而非 exec，參數以陣列傳入，不經過 shell 解析
 * @param {string} command - 執行程式名稱（例：'python3'）
 * @param {string[]} args  - 參數陣列（例：['generate_json.py', 'path/to/file.mp3']）
 * @param {Function} callback - (err, stdout) => void
 */
function safeExecFile(command, args, callback) {
  execFile(command, args, (err, stdout, stderr) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, stdout);
    }
  });
}

module.exports = { validateAnimalId, safeExecFile };
