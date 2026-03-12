const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { exec } = require('child_process');

const app  = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const ANIMALS_PATH = path.join(__dirname, 'public', 'animals.json');

// multer：依欄位名稱決定儲存目錄
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = file.fieldname === 'image'
      ? path.join(__dirname, 'public', 'images')
      : path.join(__dirname, 'public', 'sounds');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.body.id + ext);
  }
});
const upload = multer({ storage });

// POST /api/register — 新增或更新動物
app.post('/api/register',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mp3', maxCount: 1 }]),
  (req, res) => {
    const { id, emoji, symbolEmoji, bgFrom, bgTo, border, glow1, glow2 } = req.body;
    if (!id) return res.status(400).json({ error: 'id 必填' });

    const animals = JSON.parse(fs.readFileSync(ANIMALS_PATH, 'utf-8'));

    const imagePath = req.files?.image
      ? '/images/' + id + path.extname(req.files.image[0].originalname)
      : null;

    const entry = {
      id,
      emoji:       emoji       || null,
      image:       imagePath,
      symbolSvg:   null,
      symbolEmoji: symbolEmoji || emoji || '❓',
      bgFrom:      bgFrom      || '#444',
      bgTo:        bgTo        || '#666',
      border:      border      || '#888',
      glow1:       glow1       || '#fff',
      glow2:       glow2       || '#fff',
      sound:       id,
      locked:      false
    };

    // 更新或新增
    const idx = animals.animals.findIndex(a => a.id === id);
    if (idx >= 0) animals.animals[idx] = entry;
    else animals.animals.push(entry);

    fs.writeFileSync(ANIMALS_PATH, JSON.stringify(animals, null, 2));

    // 若有 MP3，自動執行分析腳本
    if (req.files?.mp3) {
      const mp3Path = path.join('public', 'sounds', id + path.extname(req.files.mp3[0].originalname));
      exec(`python3 generate_json.py "${mp3Path}"`, (err, stdout) => {
        if (err) console.error('JSON 分析失敗:', err.message);
        else console.log(stdout.trim());
      });
    }

    res.json({ success: true, animal: entry });
  }
);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}/`);
});
