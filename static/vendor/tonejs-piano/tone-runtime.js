const Tone = window.Tone

if (!Tone) {
  throw new Error('Tone runtime is not available on window.Tone')
}

export const Frequency = Tone.Frequency
export const Gain = Tone.Gain
export const Midi = Tone.Midi
export const Sampler = Tone.Sampler
export const ToneAudioBuffers = Tone.ToneAudioBuffers
export const ToneAudioNode = Tone.ToneAudioNode
export const ToneBufferSource = Tone.ToneBufferSource
export const Volume = Tone.Volume
export const intervalToFrequencyRatio = Tone.intervalToFrequencyRatio
export const isString = Tone.isString
export const optionsFromArguments = Tone.optionsFromArguments

export default Tone
