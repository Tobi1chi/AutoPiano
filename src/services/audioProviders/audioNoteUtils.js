const NOTE_INDEX = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
}

export function noteNameToMidi(noteName = 'C4') {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(noteName)
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`)
  }

  const letter = match[1].toUpperCase()
  const accidental = match[2]
  const octave = Number(match[3])
  let semitone = NOTE_INDEX[letter]

  if (accidental === '#') {
    semitone += 1
  } else if (accidental === 'b') {
    semitone -= 1
  }

  return ((octave + 1) * 12) + semitone
}

export function durationToMilliseconds(duration = '1n') {
  if (typeof duration === 'number' && isFinite(duration)) {
    return Math.max(80, duration * 1000)
  }

  if (typeof duration !== 'string') {
    return 800
  }

  const noteMatch = /^(\d+)n$/.exec(duration)
  if (noteMatch) {
    const denominator = Number(noteMatch[1])
    return Math.max(80, 2000 / denominator)
  }

  const secondMatch = /^(\d+(?:\.\d+)?)s$/.exec(duration)
  if (secondMatch) {
    return Math.max(80, Number(secondMatch[1]) * 1000)
  }

  return 800
}

export function durationToSeconds(duration = '1n') {
  return durationToMilliseconds(duration) / 1000
}

export function normalizeVelocity(velocity) {
  if (typeof velocity !== 'number') {
    return 0.72
  }

  return Math.max(0.15, Math.min(0.82, velocity))
}
