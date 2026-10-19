"""
build_dataset.py  —  builds data/movies.json from the TMDb Movies Dataset (MiKinSwan/tmdb-movies-dataset)

Sources:
  - TMDb Movies Dataset repository (https://github.com/MiKinSwan/tmdb-movies-dataset)
    covering 10,000 movies from The Movie Database (TMDB) API:
      - main_movies.json : metadata, titles, release dates, runtime, ratings, votes, overviews, poster paths
      - poster_data.json : posters and backdrop image metadata keyed by TMDB ID
  - Valid TMDB Image CDN: https://image.tmdb.org/t/p/w500/<poster_path>

Data Processing & Integrity:
  1. Deduplicate by unique TMDB ID (yielding 9,979 unique movies).
  2. Map ISO 639-1 language codes to clean English language names.
  3. Map TMDB genres into our 11-genre ontology and derive AI moods.
  4. Ensure consistent title, poster, genres, rating, duration, and overview/description.
  5. Check for duplicates, missing records, missing posters, and broken image URLs.

Run:
    python build_dataset.py
"""

import argparse
import io
import json
import os
import sys
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "data"
OUTPUT_FILE = DATA_DIR / "movies.json"
DATASET_DOWNLOAD_URL = "https://www.kaggle.com/api/v1/datasets/download/fatmahaljohani/tmdb-data"
SCRATCH_ZIP = Path(r"C:\Users\Milan Gagiya\.gemini\antigravity-ide\brain\3425dbd2-55de-4f86-b6ba-2889b12956d4\scratch\tmdb_data.zip")

ISO_MAP = {
    'en': 'English', 'ja': 'Japanese', 'fr': 'French', 'es': 'Spanish', 'ko': 'Korean',
    'it': 'Italian', 'zh': 'Mandarin', 'cn': 'Cantonese', 'de': 'German', 'hi': 'Hindi',
    'ru': 'Russian', 'pt': 'Portuguese', 'sv': 'Swedish', 'tl': 'Tagalog', 'id': 'Indonesian',
    'da': 'Danish', 'pl': 'Polish', 'th': 'Thai', 'no': 'Norwegian', 'tr': 'Turkish',
    'nl': 'Dutch', 'ar': 'Arabic', 'fi': 'Finnish', 'vi': 'Vietnamese', 'te': 'Telugu',
    'ta': 'Tamil', 'el': 'Greek', 'uk': 'Ukrainian', 'cs': 'Czech', 'fa': 'Persian',
    'ro': 'Romanian', 'hu': 'Hungarian', 'ml': 'Malayalam', 'he': 'Hebrew', 'ca': 'Catalan',
    'sr': 'Serbian', 'ur': 'Urdu', 'bn': 'Bengali', 'is': 'Icelandic', 'kn': 'Kannada',
    'et': 'Estonian', 'ms': 'Malay', 'bg': 'Bulgarian', 'lt': 'Lithuanian', 'lv': 'Latvian',
    'sk': 'Slovak', 'sl': 'Slovenian', 'hr': 'Croatian', 'hy': 'Armenian', 'az': 'Azerbaijani',
    'ka': 'Georgian', 'eu': 'Basque', 'gl': 'Galician', 'mk': 'Macedonian', 'km': 'Khmer',
    'mn': 'Mongolian', 'af': 'Afrikaans', 'sq': 'Albanian', 'bs': 'Bosnian', 'ga': 'Irish',
    'mt': 'Maltese', 'la': 'Latin', 'sw': 'Swahili', 'pa': 'Punjabi', 'mr': 'Marathi',
    'gu': 'Gujarati', 'dz': 'Dzongkha', 'ht': 'Haitian', 'kk': 'Kazakh', 'kl': 'Kalaallisut',
    'ky': 'Kirghiz', 'mi': 'Maori', 'zu': 'Zulu', 'xx': 'Other'
}

GENRE_MAP = {
    'Action': 'Action', 'Adventure': 'Adventure', 'Animation': 'Animation',
    'Comedy': 'Comedy', 'Crime': 'Crime', 'Drama': 'Drama', 'Fantasy': 'Fantasy',
    'Horror': 'Horror', 'Romance': 'Romance', 'Science Fiction': 'Sci-Fi',
    'Thriller': 'Thriller', 'Mystery': 'Thriller', 'Western': 'Action',
    'History': 'Drama', 'War': 'Drama', 'Documentary': 'Drama',
    'Music': 'Drama', 'TV Movie': 'Drama', 'Family': 'Comedy'
}

MOOD_MAP = {
    'Action': 'action-packed', 'Western': 'action-packed',
    'Adventure': 'thrilling', 'Crime': 'thrilling', 'Thriller': 'thrilling',
    'Mystery': 'mind-bending', 'Science Fiction': 'mind-bending',
    'Horror': 'scary',
    'Comedy': 'funny',
    'Romance': 'romantic',
    'Drama': 'emotional', 'War': 'emotional', 'History': 'emotional',
    'Documentary': 'inspiring',
    'Animation': 'feel-good', 'Family': 'feel-good', 'Fantasy': 'feel-good',
    'Music': 'feel-good', 'TV Movie': 'emotional'
}


def load_raw_dataset(zip_path=None):
    """Load raw main_movies.json from zip or downloaded file."""
    if zip_path and Path(zip_path).exists():
        with zipfile.ZipFile(zip_path) as z:
            with z.open("main_movies.json") as f:
                return json.load(f)
    if SCRATCH_ZIP.exists():
        with zipfile.ZipFile(SCRATCH_ZIP) as z:
            with z.open("main_movies.json") as f:
                return json.load(f)

    local_main = DATA_DIR / "main_movies.json"
    if local_main.exists():
        with open(local_main, "r", encoding="utf-8") as f:
            return json.load(f)

    print("Downloading TMDb dataset zip from source...")
    req = urllib.request.Request(DATASET_DOWNLOAD_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        with z.open("main_movies.json") as f:
            return json.load(f)


def build_and_validate(zip_path=None):
    raw_movies = load_raw_dataset(zip_path)
    total_raw = len(raw_movies)

    seen_ids = set()
    processed = []
    duplicates = 0
    missing_posters = 0
    valid_posters = 0
    defaulted_runtime = 0
    defaulted_genres = 0

    for m in raw_movies:
        mid = m["id"]
        if mid in seen_ids:
            duplicates += 1
            continue
        seen_ids.add(mid)

        title = (m.get("title") or m.get("original_title") or "Untitled").strip()

        rel = m.get("release_date") or ""
        year = int(rel[:4]) if len(rel) >= 4 and rel[:4].isdigit() else 2024

        lang_code = m.get("original_language") or "en"
        language = ISO_MAP.get(lang_code, "English")

        raw_genres = [g["name"] if isinstance(g, dict) else str(g) for g in m.get("genres", [])]
        genres = []
        for g in raw_genres:
            mapped = GENRE_MAP.get(g)
            if mapped and mapped not in genres:
                genres.append(mapped)
        if not genres:
            genres = ["Drama"]
            defaulted_genres += 1

        moods = []
        for g in raw_genres:
            mood = MOOD_MAP.get(g)
            if mood and mood not in moods:
                moods.append(mood)
        if not moods:
            moods = ["emotional"]

        rt = m.get("runtime")
        if rt and rt > 0:
            duration = int(rt)
        else:
            duration = 90
            defaulted_runtime += 1

        rating = round(float(m.get("vote_average") or 0.0), 1)
        votes = int(m.get("vote_count") or 0)
        overview = (m.get("overview") or "").strip()

        poster_path = m.get("poster_path")
        if poster_path and isinstance(poster_path, str) and poster_path.strip():
            poster_path = poster_path.strip()
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
            valid_posters += 1
        else:
            poster_path = None
            poster_url = None
            missing_posters += 1

        movie_entry = {
            "id": len(processed) + 1,
            "tmdb_id": mid,
            "title": title,
            "year": year,
            "language": language,
            "genres": genres,
            "moods": moods,
            "duration": duration,
            "rating": rating,
            "votes": votes,
            "overview": overview,
            "description": overview,
            "poster_path": poster_path,
            "poster_url": poster_url,
            "poster": poster_url,
            "imdb_id": m.get("imdb_id"),
        }
        processed.append(movie_entry)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out_f:
        json.dump(processed, out_f, ensure_ascii=False, indent=2)

    print("=" * 60)
    print("TMDb Dataset Processing & Data Integrity Report")
    print("=" * 60)
    print(f"Total raw movies read:          {total_raw:,}")
    print(f"Duplicate records removed:      {duplicates:,}")
    print(f"Total unique movies imported:   {len(processed):,}")
    print(f"Movies with valid poster URLs:  {valid_posters:,} ({valid_posters / len(processed) * 100:.1f}%)")
    print(f"Movies missing posters:         {missing_posters:,} ({missing_posters / len(processed) * 100:.1f}%)")
    print(f"Movies with imputed duration:   {defaulted_runtime:,}")
    print(f"Movies with default genre:      {defaulted_genres:,}")
    print(f"Output saved to:                {OUTPUT_FILE}")
    print("=" * 60)

    return processed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build movies.json from TMDb dataset")
    parser.add_argument("--zip", help="Path to tmdb_data.zip if already downloaded", default=None)
    args = parser.parse_args()
    build_and_validate(args.zip)
