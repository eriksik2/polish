#!/usr/bin/env python3
"""Download Wikimedia Polish word clips and trim to isolated digraph sounds.

Digraph exercises must play the consonant cluster only — not full example words
like "dżem" (jam), which confuses hear-and-type exercises.

Source words are public-domain Polish pronunciation files from Wikimedia Commons.
Run: python3 scripts/fetch-digraph-audio.py
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "digraphs"
MANIFEST_PATH = ROOT / "src" / "data" / "digraph-audio-manifest.json"

# Verified trim windows (seconds) from ffmpeg volumedetect on source OGG files
DIGRAPHS: list[dict[str, str | float]] = [
    {
        "id": "ch",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Pl-ch%C3%B3r.ogg",
        "start": 0.48,
        "end": 0.62,
        "source_word": "chór",
    },
    {
        "id": "cz",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Pl-czas-2.ogg",
        "start": 0.79,
        "end": 0.95,
        "source_word": "czas",
    },
    {
        "id": "dz",
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b7/Pl-dzwon-2.ogg",
        "start": 0.03,
        "end": 0.20,
        "source_word": "dzwon",
    },
    {
        "id": "dź",
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/56/Pl-d%C5%BAwi%C4%99k-2.ogg",
        "start": 0.17,
        "end": 0.36,
        "source_word": "dźwięk",
    },
    {
        "id": "dż",
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Pl-d%C5%BCinsy.ogg",
        "start": 0.19,
        "end": 0.38,
        "source_word": "dżinsy",
    },
    {
        "id": "rz",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Pl-rzeka.ogg",
        "start": 0.37,
        "end": 0.56,
        "source_word": "rzeka",
    },
    {
        "id": "sz",
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Pl-szum.ogg",
        "start": 0.25,
        "end": 0.44,
        "source_word": "szum",
    },
]

MAX_DURATION_S = 0.45
MIN_DURATION_S = 0.08
MIN_MEAN_VOLUME_DB = -35.0


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "PolishLearnApp/1.0"})
    with urllib.request.urlopen(req) as resp:
        dest.write_bytes(resp.read())


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


def trim_clip(source: Path, start: float, end: float, dest: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(source),
            "-ss", str(start), "-to", str(end),
            "-acodec", "libmp3lame", "-q:a", "2", str(dest),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    failed: list[str] = []

    for item in DIGRAPHS:
        digraph_id = str(item["id"])
        start = float(item["start"])
        end = float(item["end"])
        url = str(item["url"])
        word = str(item["source_word"])

        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "source.ogg"
            download(url, src)
            out_path = OUT_DIR / f"{digraph_id}.mp3"
            trim_clip(src, start, end, out_path)

        dur = duration(out_path)
        vol = mean_volume(out_path)
        ok = (
            MIN_DURATION_S <= dur <= MAX_DURATION_S
            and vol >= MIN_MEAN_VOLUME_DB
        )
        status = "ok" if ok else "BAD"
        print(
            f"{digraph_id}: {word} [{start:.2f}-{end:.2f}s] "
            f"-> {dur:.3f}s {vol:.1f}dB {status}"
        )
        manifest[digraph_id] = f"audio/digraphs/{digraph_id}.mp3"
        if not ok:
            failed.append(digraph_id)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    if failed:
        raise SystemExit(f"Digraph audio validation failed: {', '.join(failed)}")


if __name__ == "__main__":
    main()
