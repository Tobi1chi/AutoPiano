import { DEFAULT_INSTRUMENT_ID, getInstrumentManifestById, getInstrumentManifests } from '@/config/instrumentManifests'
import TonePianoProvider from '@/services/audioProviders/tonePianoProvider'
import GeneralUserGsProvider from '@/services/audioProviders/generalUserGsProvider'

class InstrumentEngine {
  constructor() {
    this.currentInstrumentId = DEFAULT_INSTRUMENT_ID
    this.currentInstrumentManifest = null
    this.currentResolvedSource = null
    this.currentSampler = null
    this.loadPromises = {}
    this.providers = {
      'tone-piano': new TonePianoProvider(),
      soundfont: new GeneralUserGsProvider()
    }
    this.statuses = {}
    this.initializeStatuses()
  }

  initializeStatuses() {
    getInstrumentManifests().forEach((manifest) => {
      this.statuses[manifest.id] = {
        state: 'idle',
        message: '尚未加载',
        resolvedSource: null,
        error: null
      }
    })
  }

  getProvider(manifest) {
    const provider = this.providers[manifest.provider]
    if (!provider) {
      throw new Error(`Unknown provider: ${manifest.provider}`)
    }
    return provider
  }

  getCurrentInstrumentManifest() {
    return this.currentInstrumentManifest || getInstrumentManifestById(this.currentInstrumentId)
  }

  getStatuses() {
    return JSON.parse(JSON.stringify(this.statuses))
  }

  getPublicState() {
    return {
      currentInstrumentId: this.currentInstrumentId,
      currentResolvedSource: this.currentResolvedSource,
      statuses: this.getStatuses()
    }
  }

  async loadInstrument(instrumentId) {
    const manifest = getInstrumentManifestById(instrumentId)
    if (!manifest) {
      throw new Error(`Unknown instrument: ${instrumentId}`)
    }

    if (this.loadPromises[instrumentId]) {
      return this.loadPromises[instrumentId]
    }

    this.statuses[instrumentId] = {
      state: 'loading',
      message: '加载中',
      resolvedSource: null,
      error: null
    }

    this.loadPromises[instrumentId] = (async () => {
      try {
        const provider = this.getProvider(manifest)
        const result = await provider.load(manifest)
        this.statuses[instrumentId] = {
          state: 'ready',
          message: result.message || '已就绪',
          resolvedSource: result.resolvedSource,
          error: null
        }
        return {
          manifest,
          provider,
          resolvedSource: result.resolvedSource
        }
      } catch (error) {
        this.statuses[instrumentId] = {
          state: 'error',
          message: '加载失败',
          resolvedSource: null,
          error: error ? error.message : 'Unknown error'
        }
        throw error
      } finally {
        delete this.loadPromises[instrumentId]
      }
    })()

    return this.loadPromises[instrumentId]
  }

  stopCurrentInstrument() {
    if (!this.currentInstrumentManifest) {
      return
    }

    try {
      this.getProvider(this.currentInstrumentManifest).stop(this.currentInstrumentManifest)
    } catch (error) {}
  }

  async activateInstrument(instrumentId) {
    const loaded = await this.loadInstrument(instrumentId)
    if (this.currentInstrumentManifest && this.currentInstrumentId !== instrumentId) {
      this.stopCurrentInstrument()
    }
    this.currentInstrumentId = instrumentId
    this.currentInstrumentManifest = loaded.manifest
    this.currentSampler = loaded.provider
    this.currentResolvedSource = loaded.resolvedSource
    return this.getPublicState()
  }

  async preloadInstrument(instrumentId) {
    await this.loadInstrument(instrumentId)
    return this.getPublicState()
  }

  async initialize(instrumentId) {
    const targetId = getInstrumentManifestById(instrumentId) ? instrumentId : DEFAULT_INSTRUMENT_ID
    return this.activateInstrument(targetId)
  }

  async ensureCurrentInstrumentReady() {
    if (!this.currentInstrumentManifest) {
      return this.activateInstrument(DEFAULT_INSTRUMENT_ID)
    }

    await this.loadInstrument(this.currentInstrumentId)
    return this.getPublicState()
  }

  getCurrentAudioTime() {
    if (!this.currentInstrumentManifest) {
      return 0
    }

    const provider = this.getProvider(this.currentInstrumentManifest)
    if (provider && typeof provider.getCurrentTime === 'function') {
      return provider.getCurrentTime()
    }

    return 0
  }

  async playNote(noteName, duration, velocity) {
    return this.playNoteAt(noteName, this.getCurrentAudioTime(), duration, velocity)
  }

  async playNoteAt(noteName, when, duration, velocity) {
    if (!this.currentInstrumentManifest) {
      await this.activateInstrument(DEFAULT_INSTRUMENT_ID)
    }

    if (!this.currentInstrumentManifest) {
      return
    }

    const provider = this.getProvider(this.currentInstrumentManifest)
    const triggerMethod = typeof provider.triggerAt === 'function'
      ? provider.triggerAt.bind(provider)
      : provider.trigger.bind(provider)

    await triggerMethod(
      this.currentInstrumentManifest,
      noteName,
      when,
      duration || '1n',
      velocity
    )
  }

  stopActiveNotes() {
    this.stopCurrentInstrument()
  }
}

const instrumentEngine = new InstrumentEngine()

export default instrumentEngine
