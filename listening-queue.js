import {estimateSeconds,timeLabel,voiceError,voiceMenu} from './speech-support.js';
export function chunkText(text) {
  const parts = [];
  while (text.length > 220) {
    let end = Math.max(text.lastIndexOf(' ', 219), text.lastIndexOf('\n', 219)) + 1 || 220;
    if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    parts.push(text.slice(0, end)); text = text.slice(end);
  }
  if (text) parts.push(text);
  return parts;
}
export function publicPath(path, origin) {
  const url = new URL(path, origin);
  if (!path.startsWith('/') || path.startsWith('//') || url.origin !== origin || url.search || url.hash) throw new Error('Not a same-site article path');
  return url.href;
}
export function articleText(doc, selector, title) {
  const source = doc.querySelector(selector);
  if (!source) throw new Error('Article content was not found');
  const copy = source.cloneNode(true);
  copy.querySelectorAll('script,style,noscript,nav,site-navbar,footer,button,select,input,textarea,form,iframe,video,audio,pre,[data-article-listener],[data-no-read],[aria-hidden="true"],[hidden],.top-header,.post-related,#bottomdiv').forEach(n => n.remove());
  copy.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
  copy.querySelectorAll('p,div,section,article,h1,h2,h3,h4,li,tr,blockquote,figcaption').forEach(n => n.append('\n'));
  const body = copy.textContent.replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').replace(/[-_]{4,}/g, '').trim();
  if (body.length < 25) throw new Error('Article text is empty or incomplete');
  return body.startsWith(title) ? body : title + '\n' + body;
}
async function main() {
  const $ = id => document.getElementById(id), status = $('status');
  let manifest;
  try {
    const response = await fetch('/listening-index.json', { credentials: 'omit', redirect: 'error' });
    if (!response.ok) throw new Error('Index unavailable');
    manifest = await response.json();
    if (!Array.isArray(manifest.articles) || !manifest.articles.length) throw new Error('Empty index');
    const seen = new Set();
    for (const a of manifest.articles) {
      publicPath(a.path, location.origin);
      if (!a.title || !Array.isArray(a.themes) || seen.has(a.path)) throw new Error('Invalid article index');
      seen.add(a.path);
    }
  } catch { status.textContent = 'The article index could not load. Reload this page to try again.'; $('play').disabled = true; return; }
  document.title = manifest.site + ' - Listen'; $('site').textContent = manifest.site + ': Listen';
  if (manifest.dark) document.body.classList.add('dark');
  let queue = manifest.articles, index = 0, parts = [], part = 0, token = 0, active = null, request = null, state = 'idle', loadedPath = null;
  let startTimer = null, startedAt = null, elapsed = 0;
  const synth = window.speechSynthesis, supported = !!synth && 'SpeechSynthesisUtterance' in window;
  const voices = supported ? voiceMenu($('voice'), synth) : null;
  function remaining() {
    if (!parts.length) { $('remaining').textContent = 'Estimated time remaining in this article: waiting for text.'; return; }
    const seconds = estimateSeconds(parts.slice(part).join(' '), $('speed').value);
    const spent = elapsed + (startedAt === null ? 0 : (performance.now() - startedAt) / 1000);
    const left = state === 'finished' ? 0 : Math.max(1, seconds - spent);
    $('remaining').textContent = `About ${timeLabel(left)} remaining in this article (estimate).`;
  }
  const clock = setInterval(remaining, 1000);
  function controls() {
    $('play').disabled = !supported || state === 'loading';
    $('play').textContent = state === 'loading' ? 'Loading text...' : state === 'ready' ? 'Play queue' : state === 'blocked' ? 'Retry voice' : ['playing','paused','starting'].includes(state) ? 'Restart article' : 'Play all';
    $('pause').disabled = !['playing','paused'].includes(state);
    $('pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
    $('stop').disabled = ['idle','ready','finished'].includes(state);
    $('previous').disabled = !supported || index <= 0;
    $('next').disabled = !supported || index >= queue.length - 1;
    $('position').textContent = `Article ${index + 1} of ${queue.length} · ${$('theme').value || 'All articles'} · catalog order`;
    remaining();
  }
  function cancel() {
    token++; request?.abort(); request = null; clearTimeout(startTimer); startTimer = null;
    if (active) synth.cancel();
    active = null; startedAt = null; elapsed = 0;
  }
  function stop(message = 'Stopped. Play restarts the selected article.') {
    cancel(); state = loadedPath === queue[index]?.path ? 'ready' : 'idle'; part = 0; controls(); status.textContent = message;
  }
  function blocked(message) {
    cancel(); state = 'blocked'; controls(); status.textContent = message;
  }
  function speak() {
    if (part >= parts.length) {
      if (index < queue.length - 1) { index++; load(true); }
      else { cancel(); state = 'finished'; controls(); status.textContent = 'Queue finished.'; }
      return;
    }
    const generation = ++token, u = new SpeechSynthesisUtterance(parts[part]); active = u;
    u.lang = document.documentElement.lang || 'en'; u.rate = Number($('speed').value);
    u.volume = 1; const voice = voices.selected(); if (voice) { u.voice = voice; u.lang = voice.lang; }
    startedAt = null; elapsed = 0; state = 'starting'; controls();
    status.textContent = 'Starting voice... If no sound starts, wait for the retry message.';
    u.onstart = () => {
      if (generation !== token) return;
      clearTimeout(startTimer); startTimer = null; state = 'playing'; startedAt = performance.now(); controls();
      status.textContent = `Voice started: article ${index + 1} of ${queue.length}, part ${part + 1} of ${parts.length} at ${$('speed').value}x. If silent, check device volume/output or try another voice.`;
    };
    u.onresume = () => { if (generation === token) { startedAt = performance.now(); status.textContent = 'Voice resumed. If silent, Stop and retry.'; } };
    u.onend = () => { if (generation !== token) return; clearTimeout(startTimer); active = null; startedAt = null; elapsed = 0; part++; speak(); };
    u.onerror = event => { if (generation === token) blocked(voiceError(event.error)); };
    startTimer = setTimeout(() => { if (generation === token) blocked('The voice did not start. Text is ready: tap Retry voice to retry directly, or choose another voice.'); }, 6000);
    try { synth.resume(); synth.speak(u); } catch { blocked('The voice could not start. Text is ready: choose a voice and tap Retry voice.'); }
  }
  async function load(autoplay = false) {
    cancel(); loadedPath = null; parts = []; part = 0;
    const generation = token; state = 'loading'; controls();
    const article = queue[index]; $('now').textContent = article.title;
    $('read').href = article.path; $('read').hidden = false; status.textContent = 'Loading article text. Playback starts only after text is ready.';
    request = new AbortController(); const controller = request;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(publicPath(article.path, location.origin), { credentials: 'omit', redirect: 'error', signal: controller.signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Article unavailable');
      const html = await response.text(); if (generation !== token) return;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      parts = chunkText(articleText(doc, manifest.selector, article.title)); loadedPath = article.path; part = 0; request = null;
      if (autoplay) speak();
      else { state = 'ready'; controls(); status.textContent = 'Article text ready. Tap Play queue to start the voice.'; }
    } catch { if (generation === token) stop('This article could not load. Press Play to retry or Next article to skip it.'); }
    finally { clearTimeout(timer); }
  }
  function playSelected() {
    if (loadedPath !== queue[index].path) { load(); return; }
    cancel(); part = 0; speak(); // First real utterance stays inside this button's tap handler.
  }
  function render() {
    const list = $('articles'); list.replaceChildren();
    queue.forEach((article, position) => {
      const li = document.createElement('li'), button = document.createElement('button'), a = document.createElement('a');
      button.type = 'button'; button.textContent = 'Choose article'; button.disabled = !supported;
      button.setAttribute('aria-label', 'Choose ' + article.title);
      button.onclick = () => { if (index === position && loadedPath === article.path) playSelected(); else { index = position; load(); } };
      a.href = article.path; a.textContent = article.title; li.append(button, a); list.append(li);
    }); controls();
  }
  for (const theme of [...new Set(manifest.articles.flatMap(a => a.themes))].sort()) {
    const option = document.createElement('option'); option.value = theme; option.textContent = theme; $('theme').append(option);
  }
  $('theme').onchange = () => { stop(); queue = manifest.articles.filter(a => !$('theme').value || a.themes.includes($('theme').value)); index = 0; render(); if (supported) load(); };
  $('play').onclick = playSelected;
  $('stop').onclick = () => stop();
  $('next').onclick = () => { if (index < queue.length - 1) { index++; load(); } };
  $('previous').onclick = () => { if (index > 0) { index--; load(); } };
  $('pause').onclick = () => {
    if (state === 'playing') { elapsed += startedAt === null ? 0 : (performance.now()-startedAt)/1000; startedAt = null; synth.pause(); state = 'paused'; status.textContent = 'Paused.'; }
    else if (state === 'paused') { if (!active) { speak(); return; } synth.resume(); state = 'playing'; status.textContent = 'Resume requested. If silent, Stop and retry.'; }
    controls();
  };
  $('speed').onchange = () => {
    if (!['playing','paused','starting'].includes(state)) { remaining(); return; }
    const paused = state === 'paused'; cancel();
    if (paused) { state = 'paused'; controls(); status.textContent = 'Speed changed. Resume repeats the current short part.'; }
    else speak();
  };
  $('voice').onchange = () => { if (parts.length) blocked('Voice selected. Tap Retry voice to restart this article.'); };
  window.addEventListener('pagehide', () => { clearInterval(clock); stop('Stopped when you left this page. Press Play to begin again.'); });
  window.addEventListener('pageshow', event => { if (event.persisted) { clearInterval(clock); location.reload(); } });
  render();
  if (!supported) { $('speed').disabled = true; $('voice').disabled = true; status.textContent = 'Speech is not available in this browser. You can still open and read the articles below.'; }
  else load(); // Prepare first article, never auto-start the first voice after an async fetch.
}
if (typeof document !== 'undefined') main();
