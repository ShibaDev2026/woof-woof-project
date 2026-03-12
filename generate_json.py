#!/usr/bin/env python3
"""
用法：python3 generate_json.py public/sounds/myfile.mp3
輸出：public/frequencies/myfile.json

依音訊 RMS 能量偵測音段，自動分類：
  sweep（≥0.25s）— 長音，觸發由內到外閃爍
  outer（<0.25s）— 短促音，觸發最外圈雙閃
"""

import sys
import os
import json
import numpy as np
import librosa

GAP_THRESHOLD  = 0.08   # 合併相鄰段落的最大靜音間隔（秒）
ENERGY_RATIO   = 0.12   # 相對最大 RMS 的能量門檻
SWEEP_MIN_DUR  = 0.25   # 長音最短時間（秒），低於此歸為 outer


def analyze(mp3_path: str) -> list:
    y, sr = librosa.load(mp3_path, sr=None, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)

    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    threshold = float(np.max(rms)) * ENERGY_RATIO

    # 偵測音段起止
    segments = []
    in_seg = False
    seg_start = 0.0
    for t, r in zip(times, rms):
        if not in_seg and r > threshold:
            in_seg = True
            seg_start = t
        elif in_seg and r <= threshold:
            in_seg = False
            segments.append([seg_start, t])
    if in_seg:
        segments.append([seg_start, float(duration)])

    # 合併相鄰段落
    merged = []
    for s, e in segments:
        if merged and s - merged[-1][1] < GAP_THRESHOLD:
            merged[-1][1] = e
        else:
            merged.append([s, e])

    # 依長度分類
    phrases = []
    for s, e in merged:
        phrases.append({
            "type":  "sweep" if (e - s) >= SWEEP_MIN_DUR else "outer",
            "start": round(s, 3),
            "end":   round(e, 3)
        })

    return phrases


def main():
    if len(sys.argv) < 2:
        print("用法：python3 generate_json.py <mp3路徑>")
        sys.exit(1)

    mp3_path = sys.argv[1]
    if not os.path.isfile(mp3_path):
        print(f"找不到檔案：{mp3_path}")
        sys.exit(1)

    base = os.path.splitext(os.path.basename(mp3_path))[0]
    out_dir = os.path.join(os.path.dirname(mp3_path), "..", "frequencies")
    out_path = os.path.join(out_dir, base + ".json")
    os.makedirs(out_dir, exist_ok=True)

    if os.path.isfile(out_path):
        print(f"已存在，跳過：{out_path}")
        return

    print(f"分析中：{mp3_path}")
    phrases = analyze(mp3_path)

    result = {
        "audioFile":    base + ".mp3",
        "gapThreshold": GAP_THRESHOLD,
        "phrases":      phrases
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"輸出：{out_path}")
    print(f"偵測到 {len(phrases)} 個音段：")
    for p in phrases:
        print(f"  [{p['type']:5s}] {p['start']:.3f}s → {p['end']:.3f}s  ({p['end']-p['start']:.3f}s)")


if __name__ == "__main__":
    main()
