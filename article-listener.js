import {estimateSeconds,timeLabel,voiceError,voiceMenu} from './speech-support.js';
/** Free read-aloud using voices supplied by the reader's browser. No API calls. */
export function chunkArticleText(text) {
  const chunks = [];
  while (text.length > 220) {
    let end = Math.max(text.lastIndexOf(' ', 219), text.lastIndexOf('\n', 219)) + 1 || 220;
    // Do not split a UTF-16 surrogate pair between utterances.
    const last = text.charCodeAt(end - 1);
    if (last >= 0xD800 && last <= 0xDBFF) end--;
    chunks.push(text.slice(0, end));
    text = text.slice(end);
  }
  if (text) chunks.push(text);
  return chunks;
}

export function mountArticleListener(source, dark = false) {
  if (!source || source.querySelector('[data-article-listener]')) return () => {};
  const panel = document.createElement('section');
  panel.dataset.articleListener = '';
  panel.setAttribute('aria-label', 'Article audio');
  panel.style.cssText = `font:16px/1.5 system-ui,sans-serif;box-sizing:border-box;margin:24px auto;padding:16px;max-width:760px;border:1px solid ${dark ? '#4b5563' : '#666'};border-radius:12px;background:${dark ? '#111827' : '#fff'};color:${dark ? '#f9fafb' : '#111'};position:relative;z-index:1;`;
  panel.innerHTML = '<strong>Listen to this article</strong><p style="margin:6px 0;font-size:14px"><a href="/listen.html" style="color:inherit;text-decoration:underline">Play all articles or choose a theme</a></p><div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:12px 0"><button type="button" data-play>Listen</button><button type="button" data-stop disabled>Stop</button><label>Speed <select aria-label="Reading speed"><option value="0.75">0.75x</option><option value="1" selected>1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="1.75">1.75x</option><option value="2">2x</option><option value="2.5">2.5x</option></select></label></div><p data-remaining aria-live="off" style="font-size:14px">Estimated time remaining: ready after Listen.</p><label>Voice <select data-voice aria-label="Reading voice" style="max-width:100%"><option value="">System default</option></select></label><p style="font-size:12px">Time remaining is an estimate at 180 words/minute at 1x, not a measured audio duration.</p><p data-status role="status" style="margin:0;font-size:14px">Uses your browser voice. Voice quality and background playback vary by device.</p>';
  for (const control of panel.querySelectorAll('button,select')) {
    control.style.cssText = 'max-width:100%;font:inherit;color:#111;background:#fff;border:1px solid #666;border-radius:6px;padding:8px 12px;min-height:44px;';
  }
  const voiceSelect = panel.querySelector('[data-voice]');
  voiceSelect.parentElement.style.cssText = 'display:block;max-width:100%;min-width:0';
  voiceSelect.style.width = '100%'; voiceSelect.style.minWidth = '0';
  const heading = source.querySelector('.post-header');
  if (heading) { heading.after(panel); panel.style.marginTop = '24px'; }
  else { source.prepend(panel); if (source === document.body) panel.style.marginTop = '88px'; }
  const play = panel.querySelector('[data-play]');
  const stop = panel.querySelector('[data-stop]');
  const speed = panel.querySelector('select[aria-label="Reading speed"]');
  const status = panel.querySelector('[data-status]');
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    play.disabled = true;
    speed.disabled = true; voiceSelect.disabled = true;
    status.textContent = 'Read-aloud is not available in this browser. Try your device screen reader or another browser.';
    return () => panel.remove();
  }
  const synth = window.speechSynthesis;
  const voices = voiceMenu(panel.querySelector('[data-voice]'), synth);
  let state = 'idle', chunks = [], index = 0, generation = 0, active = null, startTimer = null, startedAt = null, elapsed = 0;
  function remaining() {
    const seconds = estimateSeconds(chunks.slice(index).join(' '), speed.value);
    const spent = elapsed + (startedAt === null ? 0 : (performance.now() - startedAt) / 1000);
    panel.querySelector('[data-remaining]').textContent = chunks.length ? `About ${timeLabel(state === 'finished' ? 0 : Math.max(1, seconds - spent))} remaining in this article (estimate).` : 'Estimated time remaining: ready after Listen.';
  }
  const clock = setInterval(remaining, 1000);
  function reset(message = 'Stopped. Press Listen to start again.') {
    generation++; clearTimeout(startTimer); startTimer = null; startedAt = null; elapsed = 0;
    if (active) synth.cancel();
    active = null;
    state = 'idle';
    play.textContent = 'Listen';
    stop.disabled = true;
    status.textContent = message;
  }
  function text() {
    const copy = source.cloneNode(true);
    copy.querySelectorAll('[data-article-listener],script,style,noscript,nav,site-navbar,footer,button,select,input,textarea,form,iframe,video,audio,pre,[aria-hidden="true"],[hidden],.top-header,.post-related,[data-no-read]').forEach(node => node.remove());
    // Preserve block and <br> boundaries, including unwrapped text in legacy articles.
    copy.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
    copy.querySelectorAll('p,div,section,article,h1,h2,h3,h4,li,tr,blockquote,figcaption').forEach(node => node.append('\n'));
    const title = document.querySelector('h1');
    const prefix = title && !source.contains(title) ? title.textContent + '\n' : '';
    return (prefix + copy.textContent).replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').replace(/[-_]{4,}/g, '').trim();
  }
  function speak() {
    const token = ++generation;
    if (index >= chunks.length) { reset('Finished.'); state = 'finished'; remaining(); return; }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    active = utterance;
    utterance.lang = document.documentElement.lang || 'en';
    utterance.rate = Number(speed.value); utterance.volume = 1;
    const voice = voices.selected(); if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    startedAt = null; elapsed = 0;
    utterance.onstart = () => {
      if (token !== generation) return;
      clearTimeout(startTimer); state = 'playing'; startedAt = performance.now(); play.textContent = 'Pause';
      status.textContent = `Voice started: part ${index + 1} of ${chunks.length} at ${speed.value}x. If silent, check device volume/output or try another voice.`;
      remaining();
    };
    utterance.onresume = () => { if (token === generation) { startedAt = performance.now(); status.textContent = 'Voice resumed. If silent, Stop and retry.'; } };
    utterance.onend = () => {
      if (token !== generation) return;
      clearTimeout(startTimer); startedAt = null; elapsed = 0; active = null;
      index++;
      speak();
    };
    utterance.onerror = event => {
      if (token !== generation) return;
      reset(voiceError(event.error));
    };
    state = 'starting'; play.textContent = 'Restart'; stop.disabled = false;
    status.textContent = 'Starting voice...'; remaining();
    startTimer = setTimeout(() => { if (token === generation) reset('The voice did not start. Choose a voice and tap Listen to retry.'); }, 6000);
    try { synth.resume(); synth.speak(utterance); } catch { reset('The voice could not start. Choose a voice and tap Listen to retry.'); }
  }
  play.onclick = () => {
    if (state === 'playing') {
      elapsed += startedAt === null ? 0 : (performance.now()-startedAt)/1000; startedAt = null; synth.pause(); state = 'paused'; play.textContent = 'Resume'; status.textContent = 'Paused.';
    } else if (state === 'paused') {
      if (!active) { speak(); return; }
      synth.resume(); state = 'playing'; play.textContent = 'Pause'; status.textContent = 'Resume requested. If silent, Stop and retry.';
    } else {
      reset();
      // Short utterances avoid engines that silently truncate long articles.
      chunks = chunkArticleText(text());
      index = 0;
      if (!chunks.length) { status.textContent = 'No article text was found.'; return; }
      speak();
    }
  };
  stop.onclick = () => reset();
  speed.onchange = () => {
    if (['idle','finished'].includes(state)) { remaining(); return; }
    const paused = state === 'paused';
    generation++; clearTimeout(startTimer); startedAt = null; elapsed = 0;
    synth.cancel(); active = null;
    if (paused) {
      // Restart the current short part only when the reader explicitly resumes.
      state = 'paused';
      play.textContent = 'Resume';
      status.textContent = 'Speed changed. Resume repeats the current short part.';
    } else {
      speak();
      status.textContent += ' Speed change repeats the current short part.';
    }
  };
  panel.querySelector('[data-voice]').onchange = () => reset('Voice selected. Tap Listen to restart.');
  const leave = () => reset();
  window.addEventListener('pagehide', leave);
  return () => { clearInterval(clock); voices.dispose(); reset(); window.removeEventListener('pagehide', leave); panel.remove(); };
}
