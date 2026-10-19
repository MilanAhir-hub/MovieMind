// MovieMind — Shared utility functions (ported from script.js)

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const CRITERION_NAMES = {
  genre: 'Genre',
  language: 'Language',
  mood: 'Mood',
  duration: 'Duration',
  rating: 'Rating',
};

export const EXAMPLES = {
  hindiAction: { genre: 'Action', language: 'Hindi', mood: 'action-packed', max_duration: 160, min_rating: 7, max_rating: 10 },
  funnyShort:  { genre: 'Any', language: 'English', mood: 'funny', max_duration: 120, min_rating: 7, max_rating: 10 },
  anyScary:    { genre: 'Any', language: 'Any', mood: 'scary', max_duration: 180, min_rating: 6, max_rating: 10 },
  strict:      { genre: 'Any', language: 'Any', mood: 'Any', max_duration: 60, min_rating: 9, max_rating: 10 },
};

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatRating(rating) {
  return Number(rating).toFixed(1);
}

export function formatVotes(votes) {
  if (!votes) return '';
  if (votes >= 1e6) return `${(votes / 1e6).toFixed(1)}M`;
  if (votes >= 1e3) return `${Math.round(votes / 1e3)}K`;
  return String(votes);
}

export async function getJson(path, init) {
  const response = await fetch(API_BASE + path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

export function labelClass(label) {
  if (!label) return '';
  return label.split(' ')[0].toLowerCase();
}

export function getSliderBackground(value, min, max, color) {
  const pct = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #2b2b2b ${pct}%, #2b2b2b 100%)`;
}
