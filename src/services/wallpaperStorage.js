const STORAGE_KEY = 'autopiano.wallpaper'

export const DEFAULT_WALLPAPER = {
  type: 'color',
  value: 'rgba(255, 255, 255, 0.82)'
}

function normalizeWallpaper(payload) {
  if (!payload || typeof payload !== 'object') {
    return DEFAULT_WALLPAPER
  }

  if (payload.type === 'image' && typeof payload.value === 'string' && payload.value) {
    return {
      type: 'image',
      value: payload.value
    }
  }

  if (payload.type === 'color' && typeof payload.value === 'string' && payload.value) {
    return {
      type: 'color',
      value: payload.value
    }
  }

  return DEFAULT_WALLPAPER
}

export function loadWallpaper() {
  if (typeof window === 'undefined') {
    return DEFAULT_WALLPAPER
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_WALLPAPER
    }
    return normalizeWallpaper(JSON.parse(raw))
  } catch (error) {
    return DEFAULT_WALLPAPER
  }
}

export function saveWallpaper(payload) {
  if (typeof window === 'undefined') {
    return
  }

  const wallpaper = normalizeWallpaper(payload)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wallpaper))
  } catch (error) {
    // Ignore quota/storage errors and keep the in-memory wallpaper.
  }
}

export function clearWallpaper() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    // Ignore storage errors and fall back to in-memory default.
  }
}
