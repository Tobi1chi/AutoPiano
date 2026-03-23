import { durationToMilliseconds, normalizeVelocity, noteNameToMidi } from '@/services/audioProviders/audioNoteUtils'
import { getTone } from '@/services/audioProviders/toneRuntime'
import { loadModule } from '@/services/audioProviders/vendorModuleLoader'

const WORKLET_URL = '/static/vendor/spessasynth_processor.min.js'
const SPESSA_MODULE_URL = '/static/vendor/spessasynth_lib.js'
const SOUNDBANK_ID = 'generaluser-gs'

function getResolvedSourceLabel(url) {
  return url.indexOf('/static/') === 0 ? 'static' : 'remote'
}

class GeneralUserGsProvider {
  constructor() {
    this.synth = null
    this.destinationNode = null
    this.loadPromise = null
    this.loadedSource = null
    this.programCache = {}
    this.releaseTimers = {}
    this.workletRegistered = false
    this.modulePromise = null
  }

  async loadSynthModule() {
    if (!this.modulePromise) {
      this.modulePromise = loadModule(SPESSA_MODULE_URL)
    }
    return this.modulePromise
  }

  async ensureAudioContext() {
    const Tone = await getTone()
    const context = Tone.getContext()
    if (context && context.rawContext && context.rawContext.state !== 'running') {
      try {
        await Tone.start()
      } catch (error) {}
    }

    const nativeContext = context && context.rawContext
      ? (context.rawContext._nativeAudioContext || context.rawContext)
      : null
    this.destinationNode = nativeContext ? nativeContext.destination : null
    return nativeContext
  }

  async registerWorklet(audioContext) {
    if (this.workletRegistered) {
      return
    }

    await audioContext.audioWorklet.addModule(WORKLET_URL)
    this.workletRegistered = true
  }

  async initializeSynth(manifest) {
    const audioContext = await this.ensureAudioContext()
    await this.registerWorklet(audioContext)

    const synthModule = await this.loadSynthModule()
    const synth = new synthModule.WorkletSynthesizer(audioContext)
    synth.connect(this.destinationNode || audioContext.destination)
    let lastError = null

    for (let i = 0; i < manifest.soundfont.urls.length; i++) {
      const soundFontUrl = manifest.soundfont.urls[i]
      try {
        const response = await fetch(soundFontUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${soundFontUrl}: ${response.status}`)
        }
        const buffer = await response.arrayBuffer()
        await synth.soundBankManager.addSoundBank(buffer, SOUNDBANK_ID)
        await synth.isReady
        this.synth = synth
        this.loadedSource = getResolvedSourceLabel(soundFontUrl)
        return {
          resolvedSource: this.loadedSource,
          message: this.loadedSource === 'static'
            ? 'GeneralUser GS 已就绪'
            : 'GeneralUser GS 已从远程源加载'
        }
      } catch (error) {
        lastError = error
      }
    }

    synth.destroy()
    throw lastError || new Error('Unable to load GeneralUser GS')
  }

  async ensureSynth(manifest) {
    if (this.synth) {
      return {
        resolvedSource: this.loadedSource,
        message: this.loadedSource === 'static'
          ? 'GeneralUser GS 已就绪'
          : 'GeneralUser GS 已从远程源加载'
      }
    }

    if (!this.loadPromise) {
      this.loadPromise = this.initializeSynth(manifest)
        .then((result) => {
          this.loadPromise = null
          return result
        })
        .catch((error) => {
          this.loadPromise = null
          throw error
        })
    }

    return this.loadPromise
  }

  buildTimerKey(channel, midiNote) {
    return `${channel}:${midiNote}`
  }

  clearReleaseTimer(channel, midiNote) {
    const timerKey = this.buildTimerKey(channel, midiNote)
    if (this.releaseTimers[timerKey]) {
      clearTimeout(this.releaseTimers[timerKey])
      delete this.releaseTimers[timerKey]
    }
  }

  async load(manifest) {
    const state = await this.ensureSynth(manifest)
    const channel = manifest.soundfont.channel
    const program = manifest.soundfont.program

    if (this.programCache[channel] !== program) {
      this.synth.programChange(channel, program)
      this.programCache[channel] = program
    }

    return state
  }

  async trigger(manifest, noteName, duration, velocity) {
    await this.load(manifest)

    const channel = manifest.soundfont.channel
    const midiNote = noteNameToMidi(noteName)
    const releaseMs = durationToMilliseconds(duration)
    const midiVelocity = Math.round(normalizeVelocity(velocity) * 127)

    this.clearReleaseTimer(channel, midiNote)
    this.synth.noteOn(channel, midiNote, midiVelocity)
    this.releaseTimers[this.buildTimerKey(channel, midiNote)] = setTimeout(() => {
      try {
        this.synth.noteOff(channel, midiNote)
      } catch (error) {}
      delete this.releaseTimers[this.buildTimerKey(channel, midiNote)]
    }, releaseMs)
  }

  stop(manifest) {
    if (!this.synth || !manifest || !manifest.soundfont) {
      return
    }

    const channel = manifest.soundfont.channel
    Object.keys(this.releaseTimers).forEach((timerKey) => {
      if (timerKey.indexOf(`${channel}:`) === 0) {
        clearTimeout(this.releaseTimers[timerKey])
        delete this.releaseTimers[timerKey]
      }
    })

    this.synth.sendMessage([0xB0 + channel, 123, 0])
  }

  dispose() {
    if (this.synth) {
      this.synth.destroy()
      this.synth = null
    }
  }
}

export default GeneralUserGsProvider
