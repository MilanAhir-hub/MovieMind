"""
build_dataset.py  —  builds data/movies.json with about 10,000 real movies

You only run this when you want to rebuild the knowledge base. The app itself
just reads data/movies.json.

Sources
  - IMDb non-commercial datasets (https://datasets.imdbws.com/):
      title.basics.tsv.gz   -> title, year, runtime, genres
      title.ratings.tsv.gz  -> average rating, number of votes
    (IMDb allows these files for personal and non-commercial use only.)
  - Wikidata (https://www.wikidata.org, CC0 public domain):
      original language of each film, looked up by its IMDb id

Steps
  1. Keep feature films with at least MIN_VOTES votes, a runtime and genres
     (no documentaries, no adult titles).
  2. Look up each film's original language on Wikidata. When several are listed,
     pick_language() chooses one with three simple rules.
  3. Map IMDb's genres to our 11 genres and derive moods with simple IF-THEN rules
     (for example: IF the film is a Comedy THEN its mood is funny).
  4. Choose TARGET films: first the most-voted films of every language (a bigger share for
     Hindi, Tamil, Telugu and Malayalam), then the most-voted films overall.
  5. Put the 75 hand-tagged movies from curated_movies.json first, with fresh IMDb ratings.

Run (from the backend folder):
    python build_dataset.py
    python build_dataset.py --cache D:\\imdb_cache --target 10000
"""

import argparse
import csv
import gzip
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CURATED_FILE = HERE / "data" / "curated_movies.json"
OUTPUT_FILE = HERE / "data" / "movies.json"

IMDB_URL = "https://datasets.imdbws.com/"
WIKIDATA_URL = "https://query.wikidata.org/sparql"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
USER_AGENT = "MovieMind-college-project/1.0 (movie dataset builder)"

MIN_VOTES = 2500            # ignore very obscure films
MIN_RUNTIME, MAX_RUNTIME = 40, 300
LANGUAGE_QUOTA = 200        # most-voted films guaranteed for every language
QUOTA_OVERRIDES = {         # bigger share for Indian languages (the main users of this project)
    "Hindi": 900, "Tamil": 450, "Telugu": 450, "Malayalam": 450, "Kannada": 200, "Bengali": 200,
}
MIN_FILMS_PER_LANGUAGE = 40 # languages with fewer films than this are left out
WIKIDATA_BATCH = 400        # IMDb ids per Wikidata query

csv.field_size_limit(10_000_000)

# ---------------------------------------------------------------------------
# Rules that turn IMDb genres into our genre and mood vocabulary
# ---------------------------------------------------------------------------
GENRE_MAP = {
    "Action": "Action", "Adventure": "Adventure", "Animation": "Animation",
    "Comedy": "Comedy", "Crime": "Crime", "Drama": "Drama", "Fantasy": "Fantasy",
    "Horror": "Horror", "Romance": "Romance", "Sci-Fi": "Sci-Fi", "Thriller": "Thriller",
    "Mystery": "Thriller", "Film-Noir": "Crime", "Western": "Action",
    "Biography": "Drama", "History": "Drama", "War": "Drama", "Sport": "Drama",
    "Music": "Drama", "Musical": "Drama",
}

MOOD_MAP = {
    "Action": "action-packed", "Western": "action-packed",
    "Adventure": "thrilling", "Crime": "thrilling", "Thriller": "thrilling", "Film-Noir": "thrilling",
    "Mystery": "mind-bending", "Sci-Fi": "mind-bending",
    "Horror": "scary",
    "Comedy": "funny",
    "Romance": "romantic",
    "Drama": "emotional", "War": "emotional", "History": "emotional",
    "Biography": "inspiring", "Sport": "inspiring",
    "Animation": "feel-good", "Family": "feel-good", "Fantasy": "feel-good",
    "Music": "feel-good", "Musical": "feel-good",
}

# Wikidata sometimes names the same language in different ways
LANGUAGE_ALIASES = {
    "American English": "English", "British English": "English", "Australian English": "English",
    "Standard Mandarin": "Mandarin", "Mandarin Chinese": "Mandarin", "Chinese": "Mandarin",
    "Standard Chinese": "Mandarin",
    "Yue Chinese": "Cantonese", "Hindustani": "Hindi", "Bangla": "Bengali",
    "Brazilian Portuguese": "Portuguese", "European Portuguese": "Portuguese",
    "Canadian French": "French", "Quebec French": "French",
    "Swiss German": "German", "Austrian German": "German",
    "Modern Greek": "Greek", "Norwegian Bokmål": "Norwegian", "Filipino": "Tagalog",
    "Latin American Spanish": "Spanish", "Mexican Spanish": "Spanish",
}


def map_genres(imdb_genres):
    genres = []
    for genre in imdb_genres:
        mapped = GENRE_MAP.get(genre)
        if mapped and mapped not in genres:
            genres.append(mapped)
    if not genres and "Family" in imdb_genres:
        genres.append("Comedy")
    return genres


def derive_moods(imdb_genres):
    moods = []
    for genre in imdb_genres:
        mood = MOOD_MAP.get(genre)
        if mood and mood not in moods:
            moods.append(mood)
    return moods


# Hand corrections for well-known films the rules below get wrong
LANGUAGE_FIXES = {
    "tt0405508": "Hindi",      # Rang De Basanti
    "tt1188996": "Hindi",      # My Name Is Khan
    "tt2350496": "Hindi",      # The Lunchbox
    "tt10280296": "Hindi",     # Sardar Udham
    "tt1255953": "French",     # Incendies
    "tt0498380": "Japanese",   # Letters from Iwo Jima
}


def pick_language(labels, first_listed=None, foreign_title=False, common=None):
    """
    Choose ONE original language for a film (Wikidata sometimes lists several):
      1. a film whose original title differs from its English title is probably not
         an English film, so English is skipped if another language is listed;
      2. otherwise English wins if it is listed;
      3. otherwise take the language listed first on Wikidata if it is a common film
         language, else the most common film language in the list.
    `common` counts how many films use each language as their only language.
    """
    common = common or {}
    names = sorted({LANGUAGE_ALIASES.get(label, label) for label in labels})
    if len(names) <= 1:
        return names[0] if names else None
    if "English" in names:
        if not foreign_title:
            return "English"
        names.remove("English")
    first = LANGUAGE_ALIASES.get(first_listed, first_listed)
    if first in names and common.get(first, 0) >= MIN_FILMS_PER_LANGUAGE:
        return first
    return max(names, key=lambda name: common.get(name, 0))


# ---------------------------------------------------------------------------
# Downloading and reading the IMDb files
# ---------------------------------------------------------------------------
def download(name, cache):
    path = cache / name
    if not path.exists():
        print(f"Downloading {name} ...")
        request = urllib.request.Request(IMDB_URL + name, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request) as response, open(path, "wb") as out:
            while chunk := response.read(1 << 20):
                out.write(chunk)
    return path


def read_tsv(path):
    with gzip.open(path, "rt", encoding="utf-8", newline="") as file:
        yield from csv.DictReader(file, delimiter="\t", quoting=csv.QUOTE_NONE)


def load_imdb_films(cache):
    ratings = {}
    for row in read_tsv(download("title.ratings.tsv.gz", cache)):
        votes = int(row["numVotes"])
        if votes >= MIN_VOTES:
            ratings[row["tconst"]] = (float(row["averageRating"]), votes)
    print(f"{len(ratings):,} titles have at least {MIN_VOTES:,} votes")

    films = {}
    for row in read_tsv(download("title.basics.tsv.gz", cache)):
        imdb_id = row["tconst"]
        if imdb_id not in ratings or row["titleType"] != "movie" or row["isAdult"] != "0":
            continue
        if "\\N" in (row["runtimeMinutes"], row["genres"], row["startYear"]):
            continue
        runtime = int(row["runtimeMinutes"])
        imdb_genres = row["genres"].split(",")
        if not MIN_RUNTIME <= runtime <= MAX_RUNTIME or "Documentary" in imdb_genres:
            continue
        genres, moods = map_genres(imdb_genres), derive_moods(imdb_genres)
        if not genres or not moods:
            continue
        rating, votes = ratings[imdb_id]
        films[imdb_id] = {
            "imdb_id": imdb_id, "title": row["primaryTitle"], "original_title": row["originalTitle"],
            "year": int(row["startYear"]),
            "genres": genres, "moods": moods, "duration": runtime,
            "rating": rating, "votes": votes,
        }
    print(f"{len(films):,} feature films kept")
    return films


# ---------------------------------------------------------------------------
# Original language from Wikidata
# ---------------------------------------------------------------------------
def fetch_json(url, body=None, attempts=6):
    headers = {"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json, application/json"}
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(url, data=body, headers=headers)
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            wait = 10 * attempt
            print(f"  Wikidata request failed ({error}); retrying in {wait}s")
            time.sleep(wait)
    raise RuntimeError("Wikidata kept failing; run the script again later (finished batches are cached)")


def run_sparql(query):
    body = urllib.parse.urlencode({"query": query}).encode()
    return fetch_json(WIKIDATA_URL, body)["results"]["bindings"]


def wikidata_entities(ids, props, **extra):
    params = {"action": "wbgetentities", "ids": "|".join(ids), "props": props, "format": "json", **extra}
    return fetch_json(WIKIDATA_API + "?" + urllib.parse.urlencode(params))["entities"]


def chunks(items, size):
    for start in range(0, len(items), size):
        yield items[start:start + size]


def first_listed_languages(imdb_ids, cache):
    """
    For films with several original languages, find the language listed FIRST on Wikidata
    (editors normally list the main language first). Returns {imdb_id: language label}.
    """
    cache_file = cache / "wikidata_first_language.json"
    known = json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() else {}
    todo = [imdb_id for imdb_id in imdb_ids if imdb_id not in known]
    if not todo:
        return known
    print(f"Finding the main language of {len(todo):,} films with several languages")

    item_of = {}                                    # IMDb id -> Wikidata item (Q-number)
    for batch in chunks(todo, WIKIDATA_BATCH):
        values = " ".join(f'"{imdb_id}"' for imdb_id in batch)
        for row in run_sparql(f"SELECT ?imdb ?film WHERE {{ VALUES ?imdb {{ {values} }} ?film wdt:P345 ?imdb }}"):
            item_of[row["imdb"]["value"]] = row["film"]["value"].rsplit("/", 1)[-1]

    first_item = {}                                 # IMDb id -> first language item
    pairs = list(item_of.items())
    for batch in chunks(pairs, 50):
        entities = wikidata_entities([item for _, item in batch], "claims")
        for imdb_id, item in batch:
            claims = entities.get(item, {}).get("claims", {}).get("P364", [])
            claims = [c for c in claims if c.get("rank") != "deprecated" and c["mainsnak"].get("datavalue")]
            claims = [c for c in claims if c["rank"] == "preferred"] or claims
            if claims:
                first_item[imdb_id] = claims[0]["mainsnak"]["datavalue"]["value"]["id"]
        time.sleep(0.5)

    label_of = {}                                   # language item -> English name
    for batch in chunks(sorted(set(first_item.values())), 50):
        for item, entity in wikidata_entities(batch, "labels", languages="en").items():
            label_of[item] = entity.get("labels", {}).get("en", {}).get("value")

    for imdb_id in todo:
        known[imdb_id] = label_of.get(first_item.get(imdb_id))
    cache_file.write_text(json.dumps(known), encoding="utf-8")
    return known


def load_languages(films, cache):
    imdb_ids = sorted(films)
    cache_file = cache / "wikidata_languages.json"
    known = json.loads(cache_file.read_text(encoding="utf-8")) if cache_file.exists() else {}
    todo = [imdb_id for imdb_id in imdb_ids if imdb_id not in known]
    print(f"Looking up {len(todo):,} films on Wikidata ({len(known):,} already cached)")

    for start in range(0, len(todo), WIKIDATA_BATCH):
        batch = todo[start:start + WIKIDATA_BATCH]
        values = " ".join(f'"{imdb_id}"' for imdb_id in batch)
        query = f"""
            SELECT ?imdb ?label WHERE {{
              VALUES ?imdb {{ {values} }}
              ?film wdt:P345 ?imdb ; wdt:P364 ?language .
              ?language rdfs:label ?label . FILTER(LANG(?label) = "en")
            }}"""
        found = {}
        for row in run_sparql(query):
            found.setdefault(row["imdb"]["value"], []).append(row["label"]["value"])
        for imdb_id in batch:
            known[imdb_id] = found.get(imdb_id, [])
        cache_file.write_text(json.dumps(known), encoding="utf-8")
        print(f"  {min(start + WIKIDATA_BATCH, len(todo)):,}/{len(todo):,}")
        time.sleep(1)   # be polite to the free Wikidata service

    common, several = {}, []
    for imdb_id in imdb_ids:
        names = {LANGUAGE_ALIASES.get(label, label) for label in known.get(imdb_id, [])}
        if len(names) == 1:
            name = names.pop()
            common[name] = common.get(name, 0) + 1
        elif names:
            several.append(imdb_id)
    first = first_listed_languages(several, cache)

    chosen = {}
    for imdb_id in imdb_ids:
        film = films[imdb_id]
        foreign_title = simple_title(film["original_title"]) != simple_title(film["title"])
        chosen[imdb_id] = pick_language(known.get(imdb_id, []), first.get(imdb_id), foreign_title, common)
    chosen.update({imdb_id: language for imdb_id, language in LANGUAGE_FIXES.items() if imdb_id in chosen})
    return chosen


# ---------------------------------------------------------------------------
# Hand-tagged movies
# ---------------------------------------------------------------------------
def simple_title(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())


def match_curated(curated, films):
    """
    Find each hand-tagged movie in the IMDb data: year within 1, and the IMDb title or
    original title equal to ours (or, failing that, starting with ours).
    """
    by_year = {}
    for film in films.values():
        by_year.setdefault(film["year"], []).append(film)

    def names(film):
        return {simple_title(film["title"]), simple_title(film["original_title"])}

    matches = {}
    for movie in curated:
        name = simple_title(movie["title"])
        nearby = [film for year in (movie["year"] - 1, movie["year"], movie["year"] + 1)
                  for film in by_year.get(year, [])]
        candidates = ([film for film in nearby if name in names(film)] or
                      [film for film in nearby if any(n.startswith(name) for n in names(film))])
        if candidates:
            best = max(candidates, key=lambda film: film["votes"])
            matches[movie["id"]] = best
        else:
            print(f"  (no IMDb match for curated movie: {movie['title']} {movie['year']})")
    return matches


# ---------------------------------------------------------------------------
# Putting it together
# ---------------------------------------------------------------------------
def build(cache, target):
    films = load_imdb_films(cache)
    curated = json.loads(CURATED_FILE.read_text(encoding="utf-8"))
    matches = match_curated(curated, films)

    # curated movies keep their hand-made tags but get fresh IMDb rating, votes and id
    final = []
    for movie in curated:
        movie = dict(movie)
        if movie["id"] in matches:
            film = matches[movie["id"]]
            movie.update(rating=film["rating"], votes=film["votes"], imdb_id=film["imdb_id"])
            films.pop(film["imdb_id"], None)
        final.append(movie)

    languages = load_languages(films, cache)
    by_language = {}
    for imdb_id, film in films.items():
        if languages.get(imdb_id):
            film["language"] = languages[imdb_id]
            by_language.setdefault(film["language"], []).append(film)

    kept = {lang: sorted(group, key=lambda f: -f["votes"])
            for lang, group in by_language.items() if len(group) >= MIN_FILMS_PER_LANGUAGE}
    for movie in final:  # never drop the language of a curated movie
        kept.setdefault(movie["language"], [])

    slots = target - len(final)
    chosen = {}
    for language, group in kept.items():             # step 4a: quota per language
        for film in group[:QUOTA_OVERRIDES.get(language, LANGUAGE_QUOTA)]:
            chosen[film["imdb_id"]] = film
    everyone = sorted((f for group in kept.values() for f in group), key=lambda f: -f["votes"])
    for film in everyone:                            # step 4b: fill up by popularity
        if len(chosen) >= slots:
            break
        chosen.setdefault(film["imdb_id"], film)

    for film in sorted(chosen.values(), key=lambda f: -f["votes"])[:slots]:
        final.append({"id": 0, "title": film["title"], "year": film["year"], "language": film["language"],
                      "genres": film["genres"], "moods": film["moods"], "duration": film["duration"],
                      "rating": film["rating"], "votes": film["votes"], "imdb_id": film["imdb_id"]})

    for number, movie in enumerate(final, start=1):
        movie["id"] = number

    lines = ",\n  ".join(json.dumps(movie, ensure_ascii=False) for movie in final)
    OUTPUT_FILE.write_text("[\n  " + lines + "\n]\n", encoding="utf-8")

    counts = {}
    for movie in final:
        counts[movie["language"]] = counts.get(movie["language"], 0) + 1
    order = sorted(counts, key=lambda lang: -counts[lang])
    print(f"\nWrote {len(final):,} movies to {OUTPUT_FILE}")
    print("Movies per language:", ", ".join(f"{lang} {counts[lang]}" for lang in order))
    print("LANGUAGES =", json.dumps(order))
    print(f"Average rating: {sum(m['rating'] for m in final) / len(final):.2f}")


def main():
    parser = argparse.ArgumentParser(description="Build data/movies.json from IMDb + Wikidata")
    parser.add_argument("--cache", type=Path, default=HERE / "data" / "raw",
                        help="folder for downloaded files (default: data/raw)")
    parser.add_argument("--target", type=int, default=10000, help="number of movies to keep")
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    build(args.cache, args.target)


if __name__ == "__main__":
    sys.exit(main())
