const fs   = require('fs');
const path = require('path');

// ─── 路徑設定（指向專案根目錄的 logs/crawler，對應 docker-compose volume 掛載）──
const LOG_DIR      = path.join(__dirname, '..', 'logs', 'crawler');
const EVENTS_LOG   = path.join(LOG_DIR, 'events.log');
const SUSPECTS_JSON = path.join(LOG_DIR, 'suspects.json');

// ─── 確保 logs/crawler/ 目錄存在 ───────────────────────────────────────────────
fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── 偵測規則（開放封閉原則：新增爬蟲只需在此陣列加入規則，不改核心邏輯）──────
const CRAWLER_RULES = [
  // User-Agent 比對：已知掃描器
  { label: 'Shodan',     match: (req) => /shodan/i.test(req.headers['user-agent'] || '') },
  { label: 'Censys',     match: (req) => /censys/i.test(req.headers['user-agent'] || '') },
  { label: 'ZoomEye',    match: (req) => /zoomeye/i.test(req.headers['user-agent'] || '') },
  { label: 'Masscan',    match: (req) => /masscan/i.test(req.headers['user-agent'] || '') },
  { label: 'Zgrab',      match: (req) => /zgrab/i.test(req.headers['user-agent'] || '') },
  { label: 'Nmap',       match: (req) => /nmap/i.test(req.headers['user-agent'] || '') },
  { label: 'Nuclei',     match: (req) => /nuclei/i.test(req.headers['user-agent'] || '') },

  // 行為特徵：探測特定路徑
  { label: 'Gitea探測',    match: (req) => req.path.startsWith('/explore') },
  { label: '環境變數探測', match: (req) => /^\/(\.env|env|\.env\..+)$/.test(req.path) },
  { label: '管理頁探測',  match: (req) => /\/(wp-admin|wp-login|phpmyadmin|admin\.php|manager\/html)/i.test(req.path) },
  { label: 'Shell探測',   match: (req) => /\/(shell|cmd|exec|eval|webshell)/i.test(req.path) },
  { label: 'Git洩漏探測', match: (req) => /\/\.git\//i.test(req.path) },

  // 行為特徵：無 Referer 的可疑 POST 至根路徑
  { label: '異常POST掃描', match: (req) => req.method === 'POST' && !req.headers['referer'] && req.path === '/' },
];

// ─── 偵測請求是否符合任一規則 ──────────────────────────────────────────────────
function detectCrawler(req) {
  for (const rule of CRAWLER_RULES) {
    if (rule.match(req)) return rule.label;
  }
  return null;
}

// ─── 讀取 suspects.json（若不存在則回傳空物件）──────────────────────────────────
function loadSuspects() {
  try {
    return JSON.parse(fs.readFileSync(SUSPECTS_JSON, 'utf-8'));
  } catch {
    return {};
  }
}

// ─── 將偵測到的爬蟲事件寫入 events.log 並更新 suspects.json ───────────────────
function logCrawlerEvent(req, label) {
  const now     = new Date();
  const isoTime = now.toISOString();
  const ip      = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '-';
  const ua      = (req.headers['user-agent'] || '-').replace(/\|/g, '/');  // 避免 log 分隔符衝突

  // 寫入 events.log（管線分隔，易 grep）
  const line = `${isoTime} | ${label.padEnd(12)} | ${req.method.padEnd(4)} | ${ip.padEnd(15)} | ${req.path.padEnd(30)} | ${ua}\n`;
  fs.appendFileSync(EVENTS_LOG, line);

  // 更新 suspects.json 累計統計
  const suspects = loadSuspects();
  if (!suspects[ip]) {
    suspects[ip] = { label, firstSeen: isoTime, lastSeen: isoTime, count: 0, methods: [], paths: [], userAgents: [] };
  }
  const s = suspects[ip];
  s.lastSeen = isoTime;
  s.count += 1;
  s.label  = label;   // 以最新觸發的規則為主
  if (!s.methods.includes(req.method))                        s.methods.push(req.method);
  if (!s.paths.includes(req.path) && s.paths.length < 20)    s.paths.push(req.path);
  if (!s.userAgents.includes(ua) && s.userAgents.length < 5) s.userAgents.push(ua);

  fs.writeFileSync(SUSPECTS_JSON, JSON.stringify(suspects, null, 2));
}

// ─── Express Middleware：掛在所有路由前，自動偵測並紀錄 ────────────────────────
function crawlerMiddleware(req, res, next) {
  const label = detectCrawler(req);
  if (label) logCrawlerEvent(req, label);
  next();   // 無論是否為爬蟲都繼續處理請求，不阻擋
}

// ─── 讀取 events.log 並解析為結構化陣列（供 /api/crawler-logs 使用）─────────────
function parseEventsLog() {
  try {
    const raw  = fs.readFileSync(EVENTS_LOG, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    return lines.map(line => {
      const parts = line.split(' | ');
      return {
        time:   parts[0]?.trim() || '',
        label:  parts[1]?.trim() || '',
        method: parts[2]?.trim() || '',
        ip:     parts[3]?.trim() || '',
        path:   parts[4]?.trim() || '',
        ua:     parts[5]?.trim() || '',
      };
    }).reverse();  // 最新的排最前
  } catch {
    return [];
  }
}

module.exports = { crawlerMiddleware, parseEventsLog };
