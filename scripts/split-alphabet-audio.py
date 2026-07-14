#!/usr/bin/env python3
"""Split Wikimedia Polish Alphabet.oga into per-letter MP3 clips.

Source: https://commons.wikimedia.org/wiki/File:Polish_Alphabet.oga (public domain)
Run: python3 scripts/split-alphabet-audio.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

LETTERS = [
    "a", "ą", "b", "c", "ć", "d", "e", "ę", "f", "g", "h", "i", "j", "k", "l", "ł",
    "m", "n", "ń", "o", "ó", "p", "r", "s", "ś", "t", "u", "w", "y", "z", "ź", "ż",
]

# Silence detection merges w/igrek and leaves y as a 2ms blip. Verified via ffmpeg volumedetect.
MANUAL_OVERRIDES: dict[str, tuple[float, float]] = {
    "w": (24.833, 24.99),   # "wu" only — auto end 25.262 wrongly includes "igrek"
    "y": (25.00, 25.26),    # "igrek"
    "z": (25.819, 26.312),  # "zet"
}

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "letters"
SOURCE = ROOT / "scripts" / "Polish_Alphabet.oga"

MIN_MEAN_VOLUME_DB = -35.0
MIN_DURATION_S = 0.2


def mean_volume(path: Path) -> float:
    out = subprocess.run(
        ["ffmpeg", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True,
        text=True,
        check=True,
    ).stderr
    for line in out.split("\n"):
        if "mean_volume" in line:
            return float(line.split(":")[-1].replace("dB", "").strip())
    raise RuntimeError(f"Could not measure volume for {path}")


def duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(out.stdout.strip())


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

    if len(starts) < 32 or len(ends) < 31:
        raise SystemExit(f"Unexpected silence markers: {len(starts)} starts, {len(ends)} ends")

    segments: list[tuple[float, float]] = []
    for i in range(32):
        start = 0.0 if i == 0 else ends[i - 1]
        end = starts[i]
        segments.append((start, end))

    manifest: dict[str, str] = {}
    failed: list[str] = []

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
        vol = mean_volume(out_path)
        dur = duration(out_path)
        manifest[letter] = f"audio/letters/{letter}.mp3"
        status = "ok" if vol >= MIN_MEAN_VOLUME_DB and dur >= MIN_DURATION_S else "BAD"
        print(f"{letter}: {s:.3f}-{e:.3f} dur={dur:.3f}s vol={vol:.1f}dB {status}")
        if status == "BAD":
            failed.append(letter)

    manifest_path = ROOT / "src" / "data" / "letter-audio-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    if failed:
        raise SystemExit(f"Audio validation failed for: {', '.join(failed)}")


if __name__ == "__main__":
    main()
