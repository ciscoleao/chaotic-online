(function () {
  'use strict';
  const audio = document.getElementById('opening-music');
  const control = document.getElementById('music-control');
  let muted = false;
  try { muted = localStorage.getItem('chaotic-music-muted') === 'true'; } catch (_) {}
  audio.volume = 0.35;
  audio.addEventListener('pause', label);
  audio.addEventListener('play', label);
  audio.addEventListener('error', () => { control.textContent = '♫ Música indisponível'; control.disabled = true; });
  function label() {
    control.textContent = audio.paused ? '♫ Ouvir abertura' : 'Ⅱ Pausar abertura';
    control.setAttribute('aria-pressed', String(!audio.paused));
  }
  function play() {
    if (muted || document.querySelector('#screen-game.active')) return;
    if (!audio.paused) return;
    audio.play().then(label).catch(label);
  }
  control.addEventListener('click', () => {
    if (audio.paused) { muted = false; play(); }
    else { muted = true; audio.pause(); label(); }
    try { localStorage.setItem('chaotic-music-muted', String(muted)); } catch (_) {}
  });
  // Autoplay pode ser bloqueado; a primeira interação autoriza a reprodução.
  document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) play(); }, { once: true });
  document.addEventListener('keydown', play, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); else play(); });
  const screens = new MutationObserver(() => {
    if (document.querySelector('#screen-game.active')) { audio.pause(); label(); }
    else play();
  });
  document.querySelectorAll('.screen').forEach(el => screens.observe(el, { attributes: true, attributeFilter: ['class'] }));
  window.addEventListener('pagehide', () => audio.pause());
  label(); play();

  const layer = document.getElementById('auth-glyphs');
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789⌘∆◇';
  for (let i = 0; i < 30; i++) {
    const glyph = document.createElement('span');
    glyph.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    glyph.style.cssText = `left:${Math.random()*100}%;--drift:${Math.random()*220-110}px;--spin:${Math.random()*180-90}deg;font-size:${18+Math.random()*30}px;animation-duration:${16+Math.random()*20}s;animation-delay:${-Math.random()*36}s`;
    layer.append(glyph);
  }

  const dialog = document.getElementById('dromo-viewer');
  document.querySelectorAll('[data-dromo-image]').forEach(button => button.addEventListener('click', () => {
    const img = button.querySelector('img');
    dialog.querySelector('img').src = img.src;
    dialog.querySelector('img').alt = img.alt;
    dialog.querySelector('p').textContent = img.alt;
    dialog.showModal();
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
