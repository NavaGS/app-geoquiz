export const DIFFICULTY_LABELS = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard']

export function getDifficultySettings() {
  return {
    rating: parseInt(localStorage.getItem('gq_difficulty_rating') || '5', 10),
    mode: localStorage.getItem('gq_difficulty_mode') || 'inclusive',
  }
}

export function setDifficultySettings(rating, mode) {
  localStorage.setItem('gq_difficulty_rating', String(rating))
  localStorage.setItem('gq_difficulty_mode', mode)
}

export function difficultyFilter(rating, mode) {
  if (mode === 'exact') return c => c.difficulty === rating
  return c => c.difficulty <= rating  // inclusive
}
