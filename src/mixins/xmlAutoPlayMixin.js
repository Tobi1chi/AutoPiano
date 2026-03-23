// import testScore from '../../parsexml/score_output/下一个天亮.json'

import Observe from 'observe'
import { noteNameToMidi } from '@/services/audioProviders/audioNoteUtils'
export default {
  data() {
    return {
      // 上一个音符
      lastNote: {
        noteName: ''
      },
      xmlstop: false,
      xmlPlayQueue: []
    }
  },
  mounted() {
    Observe.$on('xml-music-stop', () => {
      if (this.xmlPlayQueue && this.xmlPlayQueue.length > 0) {
        this.xmlPlayQueue.shift()
        if (this.xmlPlayQueue[0]) {
          this.playXMLScore(this.xmlPlayQueue[0])
        }
      }
    })

    setTimeout(() => {
      // this.addToPlayQueue(testScore)
    }, 1e3)
  },
  methods: {
    resolveXmlVoiceRole(staffKey = '', voiceKey = '', totalStaffs = 1) {
      const normalizedStaff = String(staffKey || '')
      const voiceNumber = Number(String(voiceKey || '').replace('voice', '')) || 0
      const isSingleStaff = totalStaffs <= 1 || normalizedStaff === 'staff'
      const isUpperStaff = isSingleStaff || normalizedStaff === 'staff1'

      if (isUpperStaff && voiceNumber === 1) {
        return 'melody'
      }

      if (isUpperStaff && voiceNumber > 1) {
        return voiceNumber === 2 ? 'counter' : 'ornament'
      }

      if (!isUpperStaff && voiceNumber === 5) {
        return 'accompaniment'
      }

      return 'support'
    },
    getRoleVelocityBase(role = 'support') {
      const baseMap = {
        melody: 0.84,
        counter: 0.72,
        ornament: 0.64,
        accompaniment: 0.58,
        support: 0.52
      }

      return baseMap[role] || baseMap.support
    },
    getRoleDurationFactor(role = 'support') {
      const factorMap = {
        melody: 1.02,
        counter: 0.96,
        ornament: 0.88,
        accompaniment: 0.9,
        support: 0.84
      }

      return factorMap[role] || factorMap.support
    },
    getXmlNoteDistance(note, nextNote) {
      if (!note || !note.noteName || !nextNote || !nextNote.noteName) {
        return Infinity
      }

      try {
        return Math.abs(noteNameToMidi(nextNote.noteName) - noteNameToMidi(note.noteName))
      } catch (error) {
        return Infinity
      }
    },
    classifyXmlMotion(note, nextNote) {
      if (!nextNote || !nextNote.noteName) {
        return 'none'
      }

      if (note.noteName === nextNote.noteName) {
        return 'repeat'
      }

      const distance = this.getXmlNoteDistance(note, nextNote)
      if (distance <= 2) {
        return 'step'
      }
      if (distance <= 5) {
        return 'small-leap'
      }
      return 'large-leap'
    },
    shouldExtendXmlLegato(role, motion, note, group = [], isFastNote = false) {
      if (group.length > 1 || note.chord) {
        return false
      }

      if (role === 'melody') {
        return !isFastNote && (motion === 'step' || motion === 'small-leap' || note.tie === 'start')
      }

      if (role === 'counter') {
        return !isFastNote && motion === 'step'
      }

      return false
    },
    shouldShortenXmlAttack(role, motion, note, group = [], isFastNote = false) {
      if (motion === 'repeat') {
        return true
      }

      if (group.length > 1 || note.chord) {
        return role !== 'melody'
      }

      if (isFastNote) {
        return true
      }

      return role === 'ornament' || role === 'support'
    },
    isXmlPhraseBoundary(note, nextNote, role, motion, context = {}) {
      if (context.isMeasureEnd) {
        return true
      }

      if (!nextNote || nextNote.rest) {
        return true
      }

      if (role === 'melody' && motion === 'large-leap') {
        return true
      }

      return false
    },
    getXmlPhraseBreathFactor(note, nextNote, role, motion, context = {}) {
      if (!this.isXmlPhraseBoundary(note, nextNote, role, motion, context)) {
        return 1
      }

      const breathFactorMap = {
        melody: 0.9,
        counter: 0.88,
        accompaniment: 0.84,
        support: 0.82,
        ornament: 0.78
      }

      if (nextNote && nextNote.rest) {
        return breathFactorMap[role] || 0.82
      }

      if (motion === 'large-leap' && role === 'melody') {
        return 0.92
      }

      return breathFactorMap[role] || 0.82
    },
    applyXmlEventEnergyShaping(events = []) {
      const grouped = {}

      events.forEach((event) => {
        const key = Number(event.time || 0).toFixed(6)
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(event)
      })

      Object.keys(grouped).forEach((key) => {
        const group = grouped[key]
        const chordSize = group.length
        const totalVelocity = group.reduce((sum, event) => sum + (event.velocity || 0), 0)
        const roleWeights = group.reduce((sum, event) => {
          if (event.role === 'melody') return sum + 1
          if (event.role === 'counter') return sum + 0.75
          return sum + 0.55
        }, 0)
        const densityScale = chordSize <= 1
          ? 1
          : Math.max(0.68, 1 - ((roleWeights - 1) * 0.06))
        const totalEnergyScale = totalVelocity > 1.04
          ? 1.04 / totalVelocity
          : 1
        const energyScale = Math.min(densityScale, totalEnergyScale)

        group.forEach((event) => {
          const roleBoost = chordSize === 1 && event.role === 'melody' ? 0.015 : 0
          const roleTrim = event.role === 'accompaniment'
            ? 0.02
            : event.role === 'support'
              ? 0.03
              : event.role === 'ornament'
                ? 0.025
                : 0
          const boundaryTrim = event.isMeasureEnd
            ? (event.role === 'melody' ? 0.01 : 0.015)
            : 0
          event.velocity = Math.max(0.3, Math.min(0.78, (event.velocity * energyScale) - roleTrim - boundaryTrim + roleBoost))
        })
      })

      return events
    },
    addToPlayQueue(score) {
      if (this.xmlPlayQueue.length <= 0) {
        this.playXMLScore(score)
      }
      this.xmlPlayQueue.push(score)
    },
    initXMLPlayState() {
      this.xmlstop = false
      this.measures = []
      this.measures_len = 0
      this.lastNote = {
        noteName: ''
      }
    },
    pauseXMLPlay() {
      this.xmlstop = true
      this.stopScheduledAutoPlay()
    },
    getXmlVelocity(note, group = [], role = 'support') {
      const type = String(note.type || '')
      let velocity = this.getRoleVelocityBase(role)

      if (group.length > 1 || note.chord) {
        velocity -= role === 'melody' ? 0.03 : 0.06
      }

      if (type === 'whole' || type === 'half') {
        velocity += role === 'melody' ? 0.02 : 0.01
      }

      if (type === '16th' || type === '32nd' || type === '64th' || type === '128th' || type === '256th') {
        velocity -= role === 'melody' ? 0.05 : 0.1
      }

      if (note.dot) {
        velocity += role === 'melody' ? 0.015 : 0.005
      }

      if (note.tie === 'start') {
        velocity += role === 'melody' ? 0.01 : 0
      }

      return Math.max(0.32, Math.min(0.78, velocity))
    },
    getXmlPlaybackDuration(duration, note, nextNote, role = 'support', tieDuration = 0, group = []) {
      const type = String(note.type || '')
      const isFastNote = type === '16th' || type === '32nd' || type === '64th' || type === '128th' || type === '256th'
      const isSustained = type === 'whole' || type === 'half' || note.dot || tieDuration > duration
      const motion = this.classifyXmlMotion(note, nextNote)
      let holdDuration = duration

      if (isFastNote) {
        const fastFactorMap = {
          melody: 0.8,
          counter: 0.78,
          accompaniment: 0.76,
          support: 0.74,
          ornament: 0.72
        }
        holdDuration = duration * (fastFactorMap[role] || 0.74)
      } else if (isSustained) {
        const sustainFactorMap = {
          melody: note.tie === 'start' ? 1.16 : 1.14,
          counter: 1.02,
          accompaniment: 0.96,
          support: 0.92,
          ornament: 0.88
        }
        holdDuration = duration * (sustainFactorMap[role] || 0.94)
      } else {
        const baseFactorMap = {
          melody: 1.08,
          counter: 1.0,
          accompaniment: 0.92,
          support: 0.88,
          ornament: 0.82
        }
        holdDuration = duration * (baseFactorMap[role] || 0.88)
      }

      if (this.shouldExtendXmlLegato(role, motion, note, group, isFastNote)) {
        if (role === 'melody' && motion === 'step') {
          holdDuration = Math.max(holdDuration, duration * 1.12)
        } else if (role === 'melody' && motion === 'small-leap') {
          holdDuration = Math.max(holdDuration, duration * 1.1)
        } else if (role === 'counter') {
          holdDuration = Math.max(holdDuration, duration * 1.02)
        }
      }

      if (this.shouldShortenXmlAttack(role, motion, note, group, isFastNote)) {
        if (motion === 'repeat') {
          const repeatFactorMap = {
            melody: 0.94,
            counter: 0.88,
            accompaniment: 0.84,
            support: 0.82,
            ornament: 0.78
          }
          holdDuration = Math.min(holdDuration, duration * (repeatFactorMap[role] || 0.82))
        } else if (group.length > 1 || note.chord) {
          const chordFactorMap = {
            melody: 0.98,
            counter: 0.92,
            accompaniment: 0.9,
            support: 0.88,
            ornament: 0.84
          }
          holdDuration = Math.min(holdDuration, duration * (chordFactorMap[role] || 0.88))
        } else if (isFastNote) {
          const trimFactorMap = {
            melody: 0.8,
            counter: 0.78,
            accompaniment: 0.76,
            support: 0.74,
            ornament: 0.72
          }
          holdDuration = Math.min(holdDuration, duration * (trimFactorMap[role] || 0.74))
        }
      }

      const breathFactor = this.getXmlPhraseBreathFactor(note, nextNote, role, motion, {
        isMeasureEnd: group.some(groupNote => groupNote === note) && !nextNote
      })
      holdDuration = Math.min(holdDuration, duration * breathFactor)

      return Math.max(0.08, holdDuration)
    },
    buildXmlVoiceEvents(noteArr = [], context = {}) {
      const events = []
      let cursor = 0
      let index = 0
      const role = this.resolveXmlVoiceRole(context.staffKey, context.voiceKey, context.totalStaffs)

      while (index < noteArr.length) {
        const currentNote = noteArr[index]
        if (!currentNote || !currentNote.duration) {
          index += 1
          continue
        }

        const duration = Math.max((Number(currentNote.duration) || 0) / 1000, 0.08)
        const group = [currentNote]

        while (noteArr[index + 1] && noteArr[index + 1].chord) {
          group.push(noteArr[index + 1])
          index += 1
        }

        let nextSequentialNote = noteArr[index + 1] || null
        const isMeasureEnd = !noteArr[index + 1]

        group.forEach((note) => {
          if (note.rest || !note.noteName) {
            return
          }

          if (note.tie === 'stop') {
            return
          }

          let mergedDuration = duration
          if (note.tie === 'start') {
            let tieIndex = index + 1
            while (noteArr[tieIndex] && noteArr[tieIndex].noteName === note.noteName && noteArr[tieIndex].tie === 'stop') {
              mergedDuration += Math.max((Number(noteArr[tieIndex].duration) || 0) / 1000, 0.08)
              nextSequentialNote = noteArr[tieIndex + 1] || nextSequentialNote
              tieIndex += 1
            }
          }

          const playbackDuration = this.getXmlPlaybackDuration(
            mergedDuration,
            note,
            nextSequentialNote,
            role,
            mergedDuration,
            group
          )

          events.push({
            time: cursor,
            duration: playbackDuration,
            velocity: this.getXmlVelocity(note, group, role),
            noteName: note.noteName,
            role,
            isMeasureEnd
          })
        })

        cursor += duration
        index += 1
      }

      return {
        events,
        totalDuration: cursor
      }
    },
    buildXmlEvents(musicScore) {
      const events = []
      let scoreTime = 0
      const totalStaffs = new Set(
        (musicScore.measures || []).flatMap(measure => Object.keys(measure || {}))
      ).size || 1

      ;(musicScore.measures || []).forEach((measure) => {
        let measureDuration = 0

        Object.keys(measure || {}).forEach((staffKey) => {
          const staff = measure[staffKey]

          Object.keys(staff || {}).forEach((voiceKey) => {
            const voicePlayback = this.buildXmlVoiceEvents(staff[voiceKey] || [], {
              staffKey,
              voiceKey,
              totalStaffs
            })
            voicePlayback.events.forEach((event) => {
              events.push({
                ...event,
                time: event.time + scoreTime
              })
            })
            measureDuration = Math.max(measureDuration, voicePlayback.totalDuration)
          })
        })

        scoreTime += measureDuration
      })

      return this.applyXmlEventEnergyShaping(
        events.sort((a, b) => a.time - b.time)
      )
    },
    async playXMLScore(musicScore) {
      this.initXMLPlayState()
      const result = await this.scheduleAutoPlayEvents(this.buildXmlEvents(musicScore))

      if (result) {
        Observe.$emit('xml-music-stop')
      }
    }
  }
}
