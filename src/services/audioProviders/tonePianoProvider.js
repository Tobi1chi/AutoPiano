import { durationToMilliseconds, normalizeVelocity } from '@/services/audioProviders/audioNoteUtils'
import { getTone } from '@/services/audioProviders/toneRuntime'
import { loadModule } from '@/services/audioProviders/vendorModuleLoader'

const TONE_PIANO_MODULE_URL = '/static/vendor/tonejs-piano/piano/Piano.js'

class TonePianoProvider {
  constructor() {
    this.primaryPiano = null
    this.fallbackSampler = null
    this.activeInstrument = null
    this.releaseTimers = {}
    this.pianoModulePromise = null
    this.loadPromise = null
  }

  async loadTonePianoModule() {
    if (!this.pianoModulePromise) {
      this.pianoModulePromise = loadModule(TONE_PIANO_MODULE_URL)
    }
    return this.pianoModulePromise
  }

  async ensureAudioContext() {
    const Tone = await getTone()
    const context = Tone.getContext()
    if (context && context.rawContext && context.rawContext.state !== 'running') {
      try {
        await Tone.start()
      } catch (error) {}
    }
    return Tone
  }

  async createFallbackSampler(fallbackConfig) {
    if (this.fallbackSampler) {
      return this.fallbackSampler
    }

    const Tone = await this.ensureAudioContext()
    this.fallbackSampler = await new Promise((resolve, reject) => {
      let settled = false
      const sampler = new Tone.Sampler(fallbackConfig.samples, {
        baseUrl: fallbackConfig.baseUrl,
        release: fallbackConfig.release,
        onload: () => {
          if (settled) return
          settled = true
          sampler.volume.value = fallbackConfig.volume
          resolve(sampler.toDestination())
        }
      })

      setTimeout(() => {
        if (!settled) {
          settled = true
          reject(new Error('Timed out while loading fallback piano sampler'))
        }
      }, 15000)
    })

    return this.fallbackSampler
  }

  async loadPrimaryPiano(manifest) {
    if (!this.primaryPiano) {
      await this.ensureAudioContext()
      const pianoModule = await this.loadTonePianoModule()
      const TonePianoClass = pianoModule.Piano
      this.primaryPiano = new TonePianoClass(manifest.tonePianoOptions).toDestination()
    }

    if (!this.primaryPiano.loaded) {
      await this.primaryPiano.load()
    }

    return this.primaryPiano
  }

  async load(manifest) {
    if (this.activeInstrument) {
      return {
        resolvedSource: this.activeInstrument === this.primaryPiano ? 'package' : 'local',
        message: this.activeInstrument === this.primaryPiano
          ? '@tonejs/piano 已就绪'
          : '@tonejs/piano 加载失败，已回退到本地钢琴采样'
      }
    }

    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        try {
          this.activeInstrument = await this.loadPrimaryPiano(manifest)
          return {
            resolvedSource: 'package',
            message: '@tonejs/piano 已就绪'
          }
        } catch (error) {
          this.activeInstrument = await this.createFallbackSampler(manifest.fallbackSampler)
          return {
            resolvedSource: 'local',
            message: '@tonejs/piano 加载失败，已回退到本地钢琴采样'
          }
        }
      })()
        .finally(() => {
          this.loadPromise = null
        })
    }

    return this.loadPromise
  }

  clearReleaseTimer(noteName) {
    if (this.releaseTimers[noteName]) {
      clearTimeout(this.releaseTimers[noteName])
      delete this.releaseTimers[noteName]
    }
  }

  async trigger(manifest, noteName, duration, velocity) {
    if (!this.activeInstrument) {
      await this.load(manifest)
    }

    const activeInstrument = this.activeInstrument
    const safeVelocity = normalizeVelocity(velocity)

    if (activeInstrument && typeof activeInstrument.keyDown === 'function') {
      const releaseMs = durationToMilliseconds(duration)
      if (this.releaseTimers[noteName]) {
        try {
          activeInstrument.keyUp({
            note: noteName,
            velocity: safeVelocity
          })
        } catch (error) {}
      }
      this.clearReleaseTimer(noteName)
      activeInstrument.keyDown({
        note: noteName,
        velocity: safeVelocity
      })
      this.releaseTimers[noteName] = setTimeout(() => {
        try {
          activeInstrument.keyUp({
            note: noteName,
            velocity: safeVelocity
          })
        } catch (error) {}
        delete this.releaseTimers[noteName]
      }, releaseMs)
      return
    }

    if (activeInstrument) {
      activeInstrument.triggerAttackRelease(noteName, duration || '1n', undefined, safeVelocity)
    }
  }

  stop() {
    Object.keys(this.releaseTimers).forEach((noteName) => {
      this.clearReleaseTimer(noteName)
    })

    if (this.activeInstrument && typeof this.activeInstrument.stopAll === 'function') {
      this.activeInstrument.stopAll()
      return
    }

    if (this.activeInstrument && typeof this.activeInstrument.releaseAll === 'function') {
      this.activeInstrument.releaseAll()
    }
  }

  dispose() {
    this.stop()
  }
}

export default TonePianoProvider
