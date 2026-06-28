import { v4 as uuidv4 } from './uuid.js'

const STORAGE_KEY = 'gq_uid'

export function getAnonymousUserId() {
  let uid = localStorage.getItem(STORAGE_KEY)
  if (!uid) {
    uid = uuidv4()
    localStorage.setItem(STORAGE_KEY, uid)
  }
  return uid
}
