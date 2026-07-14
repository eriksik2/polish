# Letter audio attribution

Source: [Polish Alphabet.oga](https://commons.wikimedia.org/wiki/File:Polish_Alphabet.oga)

- **Author:** Wyksztalcioch
- **License:** Public domain
- **Description:** Native pronunciation of all 32 Polish alphabet letters in order.

Segments were extracted with `scripts/split-alphabet-audio.py` using ffmpeg silence detection, with manual boundary fixes for the final letters (y, z, ź, ż).

Letter order: a ą b c ć d e ę f g h i j k l ł m n ń o ó p r s ś t u w y z ź ż

## Digraph audio

Digraph clips are **trimmed to the isolated consonant cluster** (not full example words) from Wikimedia Commons pronunciation files. Regenerate with `scripts/fetch-digraph-audio.py`.

| Digraph | Trimmed from | Source file |
|---------|--------------|-------------|
| ch | ch in chór | [Pl-chór.ogg](https://commons.wikimedia.org/wiki/File:Pl-ch%C3%B3r.ogg) |
| cz | cz in czas | [Pl-czas-2.ogg](https://commons.wikimedia.org/wiki/File:Pl-czas-2.ogg) |
| dz | dz in dzwon | [Pl-dzwon-2.ogg](https://commons.wikimedia.org/wiki/File:Pl-dzwon-2.ogg) |
| dź | dź in dźwięk | [Pl-dźwięk-2.ogg](https://commons.wikimedia.org/wiki/File:Pl-d%C5%BAwi%C4%99k-2.ogg) |
| dż | dż in dżinsy | [Pl-dżinsy.ogg](https://commons.wikimedia.org/wiki/File:Pl-d%C5%BCinsy.ogg) |
| rz | rz in rzeka | [Pl-rzeka.ogg](https://commons.wikimedia.org/wiki/File:Pl-rzeka.ogg) |
| sz | sz in szum | [Pl-szum.ogg](https://commons.wikimedia.org/wiki/File:Pl-szum.ogg) |

All digraph source files are Polish pronunciation recordings on Wikimedia Commons (various authors; public domain or CC-BY as marked on each file page).

## Word audio

Full-word pronunciation clips for vocabulary exercises (`scripts/fetch-word-audio.py`). Files are named by normalized word id (e.g. `maz` for *mąż*). Only words with verified Commons recordings and acceptable volume are included.
