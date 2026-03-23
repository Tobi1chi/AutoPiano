const DEFAULT_LOOK_AHEAD_SECONDS = 0.1
const DEFAULT_TICK_MS = 25
const DEFAULT_START_LEAD_SECONDS = 0.05
const END_PADDING_SECONDS = 0.05

function roundTimeKey(time) {
  return Number(time || 0).toFixed(6)
}

export function groupScheduledNotes(events = []) {
  const grouped = {}

  events.forEach((event) => {
    if (!event || !event.noteName) {
      return
    }

    const eventTime = Number(event.time) || 0
    const duration = Math.max(Number(event.duration) || 0, 0.08)
    const velocity = typeof event.velocity === 'number' ? event.velocity : 0.85
    const key = roundTimeKey(eventTime)

    if (!grouped[key]) {
      grouped[key] = {
        time: eventTime,
        notes: [],
        maxDuration: duration
      }
    }

    grouped[key].notes.push({
      noteName: event.noteName,
      duration,
      velocity
    })
    grouped[key].maxDuration = Math.max(grouped[key].maxDuration, duration)
  })

  return Object.keys(grouped)
    .map(key => grouped[key])
    .sort((a, b) => a.time - b.time)
}

class AutoPlayScheduler {
  constructor(options) {
    this.getCurrentTime = options.getCurrentTime
    this.scheduleNote = options.scheduleNote
    this.stopActiveNotes = options.stopActiveNotes
    this.lookAheadSeconds = options.lookAheadSeconds || DEFAULT_LOOK_AHEAD_SECONDS
    this.tickMs = options.tickMs || DEFAULT_TICK_MS
    this.startLeadSeconds = options.startLeadSeconds || DEFAULT_START_LEAD_SECONDS
    this.intervalId = null
    this.visualTimers = []
    this.groups = []
    this.nextGroupIndex = 0
    this.startAudioTime = 0
    this.endAudioTime = 0
    this.startWallTime = 0
    this.state = 'idle'
    this.finishResolver = null
  }

  clearVisualTimers() {
    this.visualTimers.forEach(timerId => clearTimeout(timerId))
    this.visualTimers = []
  }

  clearTick() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  finish(state) {
    this.clearTick()
    this.clearVisualTimers()
    this.state = state

    if (this.finishResolver) {
      const resolve = this.finishResolver
      this.finishResolver = null
      resolve(state)
    }
  }

  stop(stopAudio = true) {
    this.clearTick()
    this.clearVisualTimers()
    this.groups = []
    this.nextGroupIndex = 0

    if (stopAudio && typeof this.stopActiveNotes === 'function') {
      this.stopActiveNotes()
    }

    if (this.finishResolver) {
      const resolve = this.finishResolver
      this.finishResolver = null
      resolve('stopped')
    }

    this.state = 'stopped'
  }

  scheduleVisualCallbacks(group, onGroupStart, onGroupEnd) {
    if (typeof onGroupStart !== 'function' && typeof onGroupEnd !== 'function') {
      return
    }

    const groupWallDelay = Math.max(0, ((this.startAudioTime + group.time) - this.getCurrentTime()) * 1000)

    if (typeof onGroupStart === 'function') {
      this.visualTimers.push(setTimeout(() => {
        onGroupStart(group)
      }, groupWallDelay))
    }

    if (typeof onGroupEnd === 'function') {
      this.visualTimers.push(setTimeout(() => {
        onGroupEnd(group)
      }, groupWallDelay + (group.maxDuration * 1000)))
    }
  }

  flush(onGroupStart, onGroupEnd) {
    if (this.state !== 'playing') {
      return
    }

    const currentTime = this.getCurrentTime()
    const lookAheadEnd = currentTime + this.lookAheadSeconds

    while (this.nextGroupIndex < this.groups.length) {
      const group = this.groups[this.nextGroupIndex]
      const groupWhen = this.startAudioTime + group.time

      if (groupWhen > lookAheadEnd) {
        break
      }

      group.notes.forEach((note) => {
        this.scheduleNote(note, groupWhen)
      })
      this.scheduleVisualCallbacks(group, onGroupStart, onGroupEnd)
      this.nextGroupIndex += 1
    }

    if (this.nextGroupIndex >= this.groups.length && currentTime >= this.endAudioTime) {
      this.finish('ended')
    }
  }

  start(events = [], options = {}) {
    this.stop(false)

    this.groups = groupScheduledNotes(events)
    if (this.groups.length <= 0) {
      this.state = 'ended'
      return Promise.resolve('ended')
    }

    this.state = 'playing'
    this.nextGroupIndex = 0
    const currentTime = this.getCurrentTime()
    this.startAudioTime = currentTime + this.startLeadSeconds
    this.startWallTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now()
    const lastGroup = this.groups[this.groups.length - 1]
    this.endAudioTime = this.startAudioTime + lastGroup.time + lastGroup.maxDuration + END_PADDING_SECONDS

    const { onGroupStart, onGroupEnd } = options

    this.flush(onGroupStart, onGroupEnd)
    this.intervalId = setInterval(() => {
      this.flush(onGroupStart, onGroupEnd)
    }, this.tickMs)

    return new Promise((resolve) => {
      this.finishResolver = resolve
    })
  }
}

export default AutoPlayScheduler
