export const GAMEPLAY_MODES = ['none', 'countdown', 'maxquestions']

export function getGameplaySettings() {
  return {
    mode: localStorage.getItem('gq_gp_mode') || 'none',
    countdownSecs: parseInt(localStorage.getItem('gq_gp_countdown_secs') || '60', 10),
    maxQuestions: parseInt(localStorage.getItem('gq_gp_max_questions') || '20', 10),
    perQuestionTimer: localStorage.getItem('gq_gp_per_q_timer') === 'true',
    perQuestionSecs: parseInt(localStorage.getItem('gq_gp_per_q_secs') || '15', 10),
  }
}

export function setGameplaySettings(s) {
  localStorage.setItem('gq_gp_mode', s.mode)
  localStorage.setItem('gq_gp_countdown_secs', String(s.countdownSecs))
  localStorage.setItem('gq_gp_max_questions', String(s.maxQuestions))
  localStorage.setItem('gq_gp_per_q_timer', String(s.perQuestionTimer))
  localStorage.setItem('gq_gp_per_q_secs', String(s.perQuestionSecs))
}
