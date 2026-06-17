const BASE_URL = 'http://localhost:8080'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

export const api = {
  getCountries: (region = 'All') => request(`/api/countries?region=${encodeURIComponent(region)}`),
  getFlag: (iso) => request(`/api/countries/${iso}/flag`),
  getShape: (iso) => request(`/api/countries/${iso}/shape`),
  getCities: (iso) => request(`/api/countries/${iso}/cities`),
  getWorldGeoJson: (region = 'All') => request(`/api/map/geojson?region=${encodeURIComponent(region)}`),
  submitAnswer: (body) => request('/api/quiz/answer', { method: 'POST', body: JSON.stringify(body) }),
  submitLanguageAnswer: (countryIso, answer) =>
    fetch(`${BASE_URL}/api/quiz/language-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryIso, answer }),
    }).then(r => r.json()),
  submitBorderAnswer: (countryIso, answer) =>
    fetch(`${BASE_URL}/api/quiz/border-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryIso, answer }),
    }).then(r => r.json()),
  logEvent: (body) => request('/api/events/quiz', { method: 'POST', body: JSON.stringify(body) }),
  getStats: () => request('/api/monitoring/stats'),
  triggerRefresh: () => request('/admin/refresh-data', { method: 'POST' }),
}

export const SSE_URL = `${BASE_URL}/api/monitoring/live`
