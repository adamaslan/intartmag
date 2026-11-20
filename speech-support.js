// Duration is a text-based estimate, not an audio-file duration or audibility check.
export function estimateSeconds(text, rate = 1) {
  const words = text.trim().match(/\S+/gu)?.length || 0;
  return Math.ceil(words / (180 * Number(rate || 1)) * 60);
}
export function timeLabel(seconds) {
  const n = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
export function voiceError(code) {
  const help = {
    'not-allowed': 'Your browser blocked the start. Tap Play again after text is ready.',
    'network': 'The voice network service failed. Try a device voice from the Voice menu.',
    'voice-unavailable': 'This voice is unavailable. Choose another voice.',
    'language-unavailable': 'No voice is available for this language. Choose another voice.',
    'synthesis-unavailable': 'No speech engine is available on this device.',
    'audio-busy': 'The audio output is busy. Close other audio and try again.',
    'audio-hardware': 'The browser cannot reach an audio output. Check the device output.'
  };
  return `Voice error (${code || 'unknown'}). ${help[code] || 'Choose another voice and tap Play to retry.'}`;
}
export function voiceMenu(select, synth) {
  let voices = [];
  const update = () => {
    const old = select.value;
    voices = synth.getVoices?.() || [];
    select.replaceChildren(new Option('System default', ''));
    voices.forEach((v, i) => select.add(new Option(`${v.name} (${v.lang})${v.localService ? ' - device' : ' - network'}`, String(i + 1))));
    // Resolve selection by stable voice URI rather than changing array positions.
    const chosen = voices.findIndex(v => v.voiceURI === old);
    [...select.options].slice(1).forEach((o, i) => { o.value = voices[i].voiceURI || String(i + 1); });
    select.value = chosen >= 0 ? voices[chosen].voiceURI : '';
  };
  update(); synth.addEventListener?.('voiceschanged', update);
  return {selected: () => voices.find((v, i) => (v.voiceURI || String(i + 1)) === select.value), dispose: () => synth.removeEventListener?.('voiceschanged', update)};
}
