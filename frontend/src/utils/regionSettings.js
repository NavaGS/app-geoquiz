export const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

export function getRegion() {
  return localStorage.getItem('gq_region') || 'All'
}

export function setRegion(r) {
  localStorage.setItem('gq_region', r)
}
