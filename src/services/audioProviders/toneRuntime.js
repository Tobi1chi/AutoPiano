import { loadScript } from '@/services/audioProviders/vendorModuleLoader'

const TONE_SCRIPT_URL = '/static/vendor/tone/Tone.js'
let tonePromise = null

export async function getTone() {
  if (typeof window === 'undefined') {
    throw new Error('Tone runtime is only available in the browser')
  }

  if (window.Tone) {
    return window.Tone
  }

  if (!tonePromise) {
    tonePromise = loadScript(TONE_SCRIPT_URL).then(() => {
      if (!window.Tone) {
        throw new Error('Tone runtime failed to initialize')
      }
      return window.Tone
    })
  }

  return tonePromise
}
