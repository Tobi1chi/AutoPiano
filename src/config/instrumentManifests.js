import { NotesMap } from '@/config/notes'

export const LOCAL_SAMPLE_BASE_URL = '/static/samples/'
export const LOCAL_SOUNDFONT_BASE_URL = '/static/soundfonts/'
export const REMOTE_GENERALUSER_GS_URL = 'https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2'
export const DEFAULT_INSTRUMENT_ID = 'piano'

function buildLocalPianoSampleMap() {
  const samples = {}
  NotesMap.forEach((note) => {
    samples[note.name] = note.file
  })
  return samples
}

function getConfiguredSoundFontUrls() {
  const urls = []

  if (typeof window !== 'undefined' && window.__AUTOPIANO_GENERALUSER_SF2_URL__) {
    urls.push(window.__AUTOPIANO_GENERALUSER_SF2_URL__)
  }

  urls.push(`${LOCAL_SOUNDFONT_BASE_URL}GeneralUser-GS.sf2`)
  urls.push(REMOTE_GENERALUSER_GS_URL)

  return urls.filter((url, index, list) => url && list.indexOf(url) === index)
}

const instrumentManifests = [
  {
    id: 'piano',
    label: 'Classic Piano',
    family: 'Keyboard',
    provider: 'soundfont',
    sampleSource: 'soundfont',
    preloadStrategy: 'lazy',
    description: '默认钢琴，使用 GeneralUser GS 的 Acoustic Grand Piano 提供更快的首音响应。',
    soundfont: {
      urls: getConfiguredSoundFontUrls(),
      channel: 0,
      program: 0
    }
  },
  {
    id: 'piano-hq',
    label: 'Concert Piano',
    family: 'Keyboard',
    provider: 'tone-piano',
    sampleSource: 'package',
    defaultVolume: -1,
    preloadStrategy: 'eager',
    description: '高质量钢琴，使用 @tonejs/piano 的 Salamander Grand Piano，页面启动后会后台预加载。',
    tonePianoOptions: {
      velocities: 6,
      maxPolyphony: 24,
      release: true,
      pedal: false
    },
    fallbackSampler: {
      baseUrl: `${LOCAL_SAMPLE_BASE_URL}piano/`,
      samples: buildLocalPianoSampleMap(),
      release: 1.6,
      volume: -2
    }
  },
  {
    id: 'guitar-acoustic',
    label: 'Acoustic Guitar',
    family: 'Strings',
    provider: 'soundfont',
    sampleSource: 'soundfont',
    preloadStrategy: 'lazy',
    description: 'GeneralUser GS 木吉他音色。',
    soundfont: {
      urls: getConfiguredSoundFontUrls(),
      channel: 1,
      program: 25
    }
  },
  {
    id: 'flute',
    label: 'Flute',
    family: 'Woodwind',
    provider: 'soundfont',
    sampleSource: 'soundfont',
    preloadStrategy: 'lazy',
    description: 'GeneralUser GS 长笛音色。',
    soundfont: {
      urls: getConfiguredSoundFontUrls(),
      channel: 2,
      program: 72
    }
  },
  {
    id: 'xylophone',
    label: 'Xylophone',
    family: 'Percussion',
    provider: 'soundfont',
    sampleSource: 'soundfont',
    preloadStrategy: 'lazy',
    description: 'GeneralUser GS 木琴音色。',
    soundfont: {
      urls: getConfiguredSoundFontUrls(),
      channel: 3,
      program: 13
    }
  }
]

export function getInstrumentManifests() {
  return instrumentManifests.map((manifest) => ({
    ...manifest,
    tonePianoOptions: manifest.tonePianoOptions
      ? { ...manifest.tonePianoOptions }
      : manifest.tonePianoOptions,
    fallbackSampler: manifest.fallbackSampler
      ? {
          ...manifest.fallbackSampler,
          samples: { ...manifest.fallbackSampler.samples }
        }
      : manifest.fallbackSampler,
    soundfont: manifest.soundfont
      ? {
          ...manifest.soundfont,
          urls: [].concat(manifest.soundfont.urls || [])
        }
      : manifest.soundfont
  }))
}

export function getInstrumentManifestById(instrumentId) {
  return getInstrumentManifests().find(item => item.id === instrumentId)
}

export function isValidInstrumentId(instrumentId) {
  return Boolean(getInstrumentManifestById(instrumentId))
}
