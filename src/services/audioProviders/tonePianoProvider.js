import { durationToSeconds, normalizeVelocity } from '@/services/audioProviders/audioNoteUtils'
import { getTone } from '@/services/audioProviders/toneRuntime'
import { loadModule } from '@/services/audioProviders/vendorModuleLoader'

const TONE_PIANO_MODULE_URL = '/static/vendor/tonejs-piano/piano/Piano.js'

class TonePianoProvider {
  constructor() {
    this.primaryPiano = null
    this.fallbackSampler = null
    this.activeInstrument = null
    this.pianoModulePromise = null
    this.loadPromise = null
    this.audioContext = null
    this.activeNotes = {}
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
    this.audioContext = context && context.rawContext
      ? (context.rawContext._nativeAudioContext || context.rawContext)
      : null
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

  getCurrentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0
  }

  async trigger(manifest, noteName, duration, velocity) {
    return this.triggerAt(manifest, noteName, this.getCurrentTime(), duration, velocity)
  }

  async triggerAt(manifest, noteName, when, duration, velocity) {
    if (!this.activeInstrument) {
      await this.load(manifest)
    }

    const activeInstrument = this.activeInstrument
    const safeVelocity = normalizeVelocity(velocity)
    const startTime = Math.max(when, this.getCurrentTime())
    const releaseTime = startTime + durationToSeconds(duration)

    if (activeInstrument && typeof activeInstrument.keyDown === 'function') {
      if (this.activeNotes[noteName] && this.activeNotes[noteName] >= startTime) {
        try {
          activeInstrument.keyUp({
            note: noteName,
            velocity: safeVelocity,
            time: Math.max(this.getCurrentTime(), startTime - 0.001)
          })
        } catch (error) {}
      }
      activeInstrument.keyDown({
        note: noteName,
        velocity: safeVelocity,
        time: startTime
      })
      activeInstrument.keyUp({
        note: noteName,
        velocity: safeVelocity,
        time: releaseTime
      })
      this.activeNotes[noteName] = releaseTime
      return
    }

    if (activeInstrument) {
      activeInstrument.triggerAttackRelease(noteName, duration || '1n', startTime, safeVelocity)
    }
  }

  stop() {
    this.activeNotes = {}

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
