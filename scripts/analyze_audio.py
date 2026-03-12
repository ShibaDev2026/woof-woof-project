#!/usr/bin/env python3
"""
analyze_audio.py  <mp3_path>

Analyzes an MP3 file and generates a JSON config with the same base name.
Phrases are derived from silence gaps (librosa.effects.split).
  - Merged segments (gap < GAP_THRESHOLD) → type: "sweep"
  - Single segments                        → type: "outer"
"""

import sys
import json
import os
import librosa

GAP_THRESHOLD = 0.10   # seconds — gaps smaller than this merge into one phrase
TOP_DB        = 20     # silence threshold in dB


def analyze(mp3_path: str) -> dict:
    y, sr = librosa.load(mp3_path)

    # Find non-silent segments
    intervals = librosa.effects.split(y, top_db=TOP_DB)
    segs = [(int(s) / sr, int(e) / sr) for s, e in intervals]

    # Merge adjacent segments closer than GAP_THRESHOLD
    phrases = []
    current = [segs[0]]
    for seg in segs[1:]:
        if seg[0] - current[-1][1] < GAP_THRESHOLD:
            current.append(seg)
        else:
            phrases.append(current)
            current = [seg]
    phrases.append(current)

    result_phrases = []
    for p in phrases:
        start = round(p[0][0], 3)
        end   = round(p[-1][1], 3)
        ptype = "sweep" if len(p) > 1 else "outer"
        result_phrases.append({"type": ptype, "start": start, "end": end})

    return {
        "audioFile": os.path.basename(mp3_path),
        "gapThreshold": GAP_THRESHOLD,
        "phrases": result_phrases
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python3 {sys.argv[0]} <path/to/audio.mp3>")
        sys.exit(1)

    mp3_path = sys.argv[1]
    config   = analyze(mp3_path)

    # 輸出到 public/frequencies/ 目錄（與 public/sounds/ 同層）
    sounds_dir = os.path.dirname(os.path.abspath(mp3_path))
    public_dir = os.path.dirname(sounds_dir)
    freq_dir   = os.path.join(public_dir, "frequencies")
    os.makedirs(freq_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(mp3_path))[0]
    out_path  = os.path.join(freq_dir, base_name + ".json")
    with open(out_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"Written: {out_path}")
    for p in config["phrases"]:
        print(f"  [{p['type']:5}] {p['start']:.3f} ~ {p['end']:.3f}s")
