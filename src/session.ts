export interface CurrentSession {
  eventId: string
  eventCode?: string
  eventName?: string
  attendeeId: string
  attendeeName: string
  isHost: boolean
}

const KEY = 'beerfest.session.v1'

export function saveSession(session: CurrentSession) {
  localStorage.setItem(KEY, JSON.stringify(session))
  // Dispatch custom event to notify components of session update
  window.dispatchEvent(new CustomEvent('sessionUpdated'))
}

export function loadSession(): CurrentSession | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CurrentSession
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY)
  // Dispatch custom event to notify components of session update
  window.dispatchEvent(new CustomEvent('sessionUpdated'))
}


