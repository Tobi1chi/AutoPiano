import Observe from 'observe'
import { OBEvent } from 'config'
import { Midi } from '@tonejs/midi'

const MIDI_PLAYBACK_STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  STOPPED: 'stopped',
  ENDED: 'ended'
}

export default {
  data() {
    return {
      currentMidiData: null,
      midiEvents: [],
      midiPlaybackState: MIDI_PLAYBACK_STATES.IDLE
    }
  },
  computed: {
    shouldShowNoteRain() {
      return !window.isMobile
    }
  },
  methods: {
    buildMidiEvents(midiData) {
      const events = []

      midiData.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          if (!note || !note.name) {
            return
          }

          events.push({
            time: Number(note.time) || 0,
            duration: Math.max(Number(note.duration) || 0, 0.08),
            velocity: typeof note.velocity === 'number' ? note.velocity : 0.85,
            noteName: note.name
          })
        })
      })

      return events.sort((a, b) => a.time - b.time)
    },
    loadMidiAndPlay(midi) {
      Midi.fromUrl(midi).then((data) => {
        this.currentMidiData = data
        this.midiEvents = this.buildMidiEvents(data)
        this.playMidi()
      });
    },
    async playMidi() {
      if (this.currentMidiData) {
        const events = this.midiEvents.slice()
        this.stopScheduledAutoPlay()
        this.midiPlaybackState = MIDI_PLAYBACK_STATES.PLAYING
        Observe.$emit(OBEvent.HIDE_GLOBAL_LOADING)
        const result = await this.scheduleAutoPlayEvents(events)

        if (result === 'ended') {
          this.midiPlaybackState = MIDI_PLAYBACK_STATES.ENDED
          Observe.$emit(OBEvent.MUSIC_END)
        } else {
          this.midiPlaybackState = MIDI_PLAYBACK_STATES.STOPPED
        }
      }
    },
    stopMidiPlay() {
      this.stopScheduledAutoPlay()
      this.midiPlaybackState = MIDI_PLAYBACK_STATES.STOPPED
      this.currentMidiData = null
      this.midiEvents = []
    }
  }
}
