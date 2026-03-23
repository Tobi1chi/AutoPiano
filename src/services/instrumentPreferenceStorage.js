import { DEFAULT_INSTRUMENT_ID, isValidInstrumentId } from '@/config/instrumentManifests'

const STORAGE_KEY = 'autopiano.instrument-preferences'
const DEFAULT_PREFERENCE = { defaultInstrumentId: DEFAULT_INSTRUMENT_ID }

function normalizePreference(payload) {
  if (!payload || typeof payload !== 'object') {
    return DEFAULT_PREFERENCE
  }

  if (
    typeof payload.defaultInstrumentId === 'string' &&
    isValidInstrumentId(payload.defaultInstrumentId)
  ) {
    return { defaultInstrumentId: payload.defaultInstrumentId }
  }

  return DEFAULT_PREFERENCE
}

export function loadInstrumentPreference() {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PREFERENCE
    }
    return normalizePreference(JSON.parse(raw))
  } catch (error) {
    return DEFAULT_PREFERENCE
  }
}

export function saveInstrumentPreference(payload) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePreference(payload)))
  } catch (error) {
    // Ignore persistence failures and keep runtime behavior.
  }
}
