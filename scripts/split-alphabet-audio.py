#!/usr/bin/env python3
"""Split Wikimedia Polish Alphabet.oga into per-letter MP3 clips.

Source: https://commons.wikimedia.org/wiki/File:Polish_Alphabet.oga (public domain)
Run: python3 scripts/split-alphabet-audio.py
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

LETTERS = [
    "a", "ą", "b", "c", "ć", "d", "e", "ę", "f", "g", "h", "i", "j", "k", "l", "ł",
    "m", "n", "ń", "o", "ó", "p", "r", "s", "ś", "t", "u", "w", "y", "z", "ź", "ż",
]

# Manual fixes for tricky end-of-file silence detection (w y z ź ż cluster)
MANUAL_OVERRIDES: dict[str, tuple[float, float]] = {
    "y": (25.514, 25.82),
    "z": (25.82, 26.32),
    "ź": (26.87, 27.24),
    "ż": (27.68, 28.12),
}

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "letters"
SOURCE = ROOT / "scripts" / "Polish_Alphabet.oga"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if not SOURCE.exists():
        raise SystemExit(f"Download source to {SOURCE} first")

    out = subprocess.run(
        [
            "ffmpeg", "-i", str(SOURCE),
            "-af", "silencedetect=noise=-30dB:d=0.25",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stderr

    starts: list[float] = []
    ends: list[float] = []
    for line in out.split("\n"):
        if m := re.search(r"silence_start: ([0-9.]+)", line):
            starts.append(float(m.group(1)))
        if m := re.search(r"silence_end: ([0-9.]+)", line):
            ends.append(float(m.group(1)))

    segments: list[tuple[float, float]] = []
    for i in range(32):
        start = 0.0 if i == 0 else ends[i - 1]
        end = starts[i]
        segments.append((start, end))

    manifest: dict[str, str] = {}
    for letter, (start, end) in zip(LETTERS, segments):
        if letter in MANUAL_OVERRIDES:
            start, end = MANUAL_OVERRIDES[letter]
        s = max(0.0, start - 0.01)
        e = min(29.2, end + 0.01)
        out_path = OUT_DIR / f"{letter}.mp3"
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(SOURCE),
                "-ss", str(s), "-to", str(e),
                "-acodec", "libmp3lame", "-q:a", "2", str(out_path),
            ],
            check=True,
            capture_output=True,
        )
        manifest[letter] = f"audio/letters/{letter}.mp3"
        print(f"{letter}: {s:.3f}-{e:.3f}")

    manifest_path = ROOT / "src" / "data" / "letter-audio-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
