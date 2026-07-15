#!/usr/bin/env python3
"""Download full-word pronunciation clips from Wikimedia Commons.

Native recordings go in word-audio-manifest.json and always take precedence
over grapheme-spelling fallbacks (see word-grapheme-fallbacks.json).

Run: python3 scripts/fetch-word-audio.py
Then: python3 scripts/generate-word-grapheme-fallbacks.py
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

MIN_MEAN_VOLUME_DB = -40.0
MAX_DURATION_S = 8.0
MIN_DURATION_S = 0.25


def load_word_list() -> list[str]:
    """All exercise + basic vocabulary words (deduped, surface forms)."""
    basic_src = (ROOT / "src" / "data" / "basicWords.ts").read_text()
    basic = []
    pattern = re.compile(
        r"bw\(\s*'((?:\\'|[^'])*)'\s*,\s*(?:'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\")",
    )
    for m in pattern.finditer(basic_src):
        basic.append(m.group(1).replace("\\'", "'"))

    legacy = [
        "auto", "mama", "tam", "mąż", "bardzo", "brat", "być", "co", "cały",
        "ćma", "leć", "dom", "dzień", "sen", "tak", "głowa", "fala", "grać",
        "chleb", "igła", "jeden", "kot", "lampa", "łapać", "morze", "nowy",
        "oko", "rok", "pies", "ryba", "syn", "tata", "duży", "woda", "my",
        "zima", "źle", "może", "czas", "cześć", "cztery", "dzban", "dzwon",
        "dźwig", "dziadek", "dzisiaj", "dżem", "dżungla", "dżinsy", "rzeka",
        "marzec", "szum", "szkoła", "nasz", "chory", "brzuch", "przyjaciel",
    ]

    seen: set[str] = set()
    out: list[str] = []
    for w in [*basic, *legacy]:
        key = slug(w)
        if key not in seen:
            seen.add(key)
            out.append(w)
    return out


def commons_titles(word: str) -> list[str]:
    """Try common Wikimedia Commons naming patterns for Polish words."""
    titles = [f"Pl-{word}.ogg"]
    if " " in word:
        titles.append(f"Pl-{word.replace(' ', '_')}.ogg")
    no_punct = re.sub(r"[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]", "", word, flags=re.UNICODE).strip()
    if no_punct != word:
        titles.append(f"Pl-{no_punct}.ogg")
        if " " in no_punct:
            titles.append(f"Pl-{no_punct.replace(' ', '_')}.ogg")
    # dedupe preserving order
    seen: set[str] = set()
    out: list[str] = []
    for t in titles:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def commons_search(word: str) -> str | None:
    """Search Commons for Pl-{word}.ogg style pronunciation files."""
    slugged = slug(word)
    queries = [
        f'File:Pl-{word}.ogg',
        f'File:Pl-{slugged}.ogg',
        f'intitle:"Pl-{slugged}.ogg"',
    ]
    for q in queries:
        params = urllib.parse.urlencode({
            "action": "query",
            "list": "search",
            "srsearch": q,
            "srnamespace": 6,
            "srlimit": 5,
            "format": "json",
        })
        req = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?{params}",
            headers={"User-Agent": "PolishLearnApp/1.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.load(resp)
        except urllib.error.HTTPError:
            continue
        for hit in data.get("query", {}).get("search", []):
            title = hit.get("title", "")
            if not title.startswith("File:Pl-"):
                continue
            if not title.lower().endswith((".ogg", ".oga", ".wav")):
                continue
            url = commons_url_from_title(title)
            if url:
                return url
    return None


def commons_url_from_title(title: str) -> str | None:
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
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.load(resp)
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 5:
                time.sleep(5 * (2 ** attempt))
                continue
            return None
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page:
            return None
        info = page.get("imageinfo", [{}])[0]
        return info.get("url")
    return None


def commons_url(word: str) -> str | None:
    for title in commons_titles(word):
        url = commons_url_from_title(f"File:{title}")
        if url:
            return url
    return commons_search(word)


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "PolishLearnApp/1.0"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
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
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text())

    words = load_word_list()
    missing: list[str] = []
    added = 0

    for word in words:
        key = slug(word)
        if key in manifest:
            continue

        time.sleep(1.2)
        try:
            url = commons_url(word)
        except urllib.error.HTTPError as e:
            print(f"{word}: HTTP {e.code}, skipping")
            time.sleep(10)
            continue
        if not url:
            print(f"{word}: no Commons file")
            missing.append(word)
            continue

        try:
            with tempfile.TemporaryDirectory() as tmp:
                src = Path(tmp) / "src.ogg"
                download(url, src)
                out_path = OUT_DIR / f"{key}.mp3"
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
                manifest[key] = f"audio/words/{key}.mp3"
                MANIFEST_PATH.write_text(
                    json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + "\n",
                )
                added += 1
            else:
                out_path.unlink(missing_ok=True)
                missing.append(word)
        except Exception as e:
            print(f"{word}: error {e}")
            missing.append(word)
            time.sleep(5)

    MANIFEST_PATH.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + "\n")
    print(f"\n{len(manifest)} words in manifest (+{added} new), {len(missing)} not fetched this run")


if __name__ == "__main__":
    main()
