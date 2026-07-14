#!/usr/bin/env python3
"""Download full-word pronunciation clips from Wikimedia Commons.

Word exercises need entire words spoken, not trimmed digraph fragments.
Skips words with no Commons file or failed validation.

Run: python3 scripts/fetch-word-audio.py
"""
from __future__ import annotations

import json
import re
import subprocess
import tempfile
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "audio" / "words"
MANIFEST_PATH = ROOT / "src" / "data" / "word-audio-manifest.json"

# Curated words used in exercises — expand as Commons files are verified
WORDS = [
    "auto", "mama", "tam", "mąż", "bardzo", "brat", "być", "co", "cały",
    "ćma", "leć", "dom", "dzień", "sen", "tak", "głowa", "fala", "grać",
    "chleb", "igła", "jeden", "kot", "lampa", "łapać", "morze", "nowy",
    "oko", "rok", "pies", "ryba", "syn", "tata", "duży", "woda", "my",
    "zima", "źle", "może", "czas", "cześć", "cztery", "dzban", "dzwon",
    "dźwig", "dziadek", "dzisiaj", "dżem", "dżungla", "dżinsy", "rzeka",
    "marzec", "szum", "szkoła", "nasz", "chory", "brzuch", "przyjaciel",
]

MIN_MEAN_VOLUME_DB = -40.0
MAX_DURATION_S = 3.0
MIN_DURATION_S = 0.3


def commons_url(word: str) -> str | None:
    title = f"File:Pl-{word}.ogg"
    params = urllib.parse.urlencode({
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json",
    })
    req = urllib.request.Request(
        f"https://commons.wikimedia.org/w/api.php?{params}",
        headers={"User-Agent": "PolishLearnApp/1.0"},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.load(resp)
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page:
            return None
        info = page.get("imageinfo", [{}])[0]
        return info.get("url")
    return None


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "PolishLearnApp/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req) as resp:
                dest.write_bytes(resp.read())
            return
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise


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
    raise RuntimeError(f"No volume for {path}")


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


def slug(word: str) -> str:
    s = unicodedata.normalize("NFD", word.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("ł", "l")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}
    missing: list[str] = []

    for word in WORDS:
        time.sleep(0.6)
        url = commons_url(word)
        if not url:
            print(f"{word}: no Commons file")
            missing.append(word)
            continue

        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "src.ogg"
            download(url, src)
            out_path = OUT_DIR / f"{slug(word)}.mp3"
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", str(src),
                    "-acodec", "libmp3lame", "-q:a", "2", str(out_path),
                ],
                check=True,
                capture_output=True,
            )

        dur = duration(out_path)
        vol = mean_volume(out_path)
        ok = MIN_DURATION_S <= dur <= MAX_DURATION_S and vol >= MIN_MEAN_VOLUME_DB
        status = "ok" if ok else "BAD"
        print(f"{word}: {dur:.2f}s {vol:.1f}dB {status}")
        if ok:
            manifest[slug(word)] = f"audio/words/{slug(word)}.mp3"
        else:
            missing.append(word)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"\n{len(manifest)} words in manifest, {len(missing)} skipped")


if __name__ == "__main__":
    main()
