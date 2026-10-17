"""
app.py  —  Flask REST API + web server

Run:   python app.py
Open:  http://127.0.0.1:5000

Endpoints
    GET  /               the web page (frontend/index.html)
    GET  /api/options    genres, languages, moods and scoring weights for the form
    GET  /api/movies     the knowledge base (?search=title text, ?limit=rows, default 100)
    POST /api/recommend  preferences in, top-5 recommendations + reasoning trace out
"""

from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from heuristic import WEIGHTS
from knowledge_base import ANY, GENRES, LANGUAGES, MOODS, load_movies
from recommender import DEFAULT_PREFERENCES, TOP_K, recommend, validate_preferences

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
app.json.sort_keys = False   # keep JSON keys in our order (e.g. genre, language, mood, ...)

MOVIES = load_movies()   # the knowledge base is loaded once, when the server starts


@app.after_request
def allow_cross_origin(response):
    """Let the page call the API even if index.html is opened straight from disk."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/options")
def options():
    return jsonify({
        "any": ANY,
        "genres": GENRES,
        "languages": LANGUAGES,
        "moods": MOODS,
        "weights": WEIGHTS,
        "defaults": DEFAULT_PREFERENCES,
        "top_k": TOP_K,
        "movie_count": len(MOVIES),
    })


@app.get("/api/movies")
def movies():
    search = request.args.get("search", "").strip().lower()
    limit = request.args.get("limit", default=100, type=int)
    matches = [m for m in MOVIES if search in m["title"].lower()] if search else MOVIES
    return jsonify({
        "total": len(MOVIES),
        "matches": len(matches),
        "movies": matches[:max(0, limit)],
    })


@app.post("/api/recommend")
def recommend_movies():
    try:
        prefs = validate_preferences(request.get_json(silent=True))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    return jsonify(recommend(prefs, MOVIES))


if __name__ == "__main__":
    print("Movie recommender running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
