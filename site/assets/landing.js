/* Navegação do site: painéis acessíveis, endereços diretos e galeria de Perim. */
(function () {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"][data-site-tab]')];
  const panels = [...document.querySelectorAll('.site-panel')];
  const aliases = { 'o-jogo': 'explorar', batalhas: 'dromos', como: 'guia' };
  const asset = name => '/site-assets/' + name + '.webp?v=' + SITE_CONTENT.assetVersion;
  const locations = {
    patio: { name: 'Pátio Central', tag: 'SEU PONTO DE PARTIDA', art: 'patio',
      text: 'Encontre outros portadores, converse com os personagens do Pátio e prepare seu próximo salto para Perim.',
      items: ['Missões com Peyton e Sarah', 'Forja, depósito e lojas', 'Portais para explorar e batalhar'] },
    floresta: { name: 'Floresta da Vida', tag: 'OVERWORLD', art: 'floresta',
      text: 'Explore os caminhos da floresta, registre criaturas no Scanner e descubra novos campos no Atlas de Perim.',
      items: ['Criaturas e materiais para coletar', 'Exploração e registro de Scans', 'Trilhas, água e áreas de cobertura'] },
    submundo: { name: 'Submundo', tag: 'UNDERWORLD', art: 'submundo',
      text: 'Atravesse um cenário de lava e rochas. Prepare suas pilhas e procure criaturas da tribo UnderWorld.',
      items: ['Paisagens vulcânicas', 'Novas criaturas para sua coleção', 'Áreas liberadas conforme seu progresso'] },
    caverna: { name: 'Caverna Secreta', tag: 'COLETE E ESCAPE', art: 'caverna',
      text: 'A caverna é uma área de coleta. Explore, recolha materiais e volte pela corda antes do desmoronamento.',
      items: ['Desmoronamento em ' + SITE_CONTENT.caveSeconds + ' segundos', 'Coleta automática de materiais', 'Corda de saída para retornar a Perim'] },
    quarto: { name: 'Seu quarto', tag: 'UM LUGAR SEU EM CHAOTIC', art: 'quarto',
      text: 'Entre no seu quarto e organize a decoração. Compre móveis, escolha acabamentos e deixe o espaço com sua cara.',
      items: ['Móveis e itens de decoração', 'Personalização de paredes e piso', 'Compras e decoração no seu progresso'] }
  };

  function tabFromHash() {
    const name = location.hash.slice(1);
    return aliases[name] || name || 'inicio';
  }
  function activate(name, { focus = false, navigate = false, show = false } = {}) {
    const selected = tabs.find(tab => tab.dataset.siteTab === name) || tabs[0];
    name = selected.dataset.siteTab;
    if (show) showScreen('screen-landing');
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== selected.getAttribute('aria-controls'); });
    if (navigate && location.hash !== '#' + name) history.pushState(null, '', '#' + name);
    if (focus) selected.focus();
    if (show) window.scrollTo(0, 0);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.siteTab, { navigate: true, show: true }));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next].dataset.siteTab, { focus: true, navigate: true, show: true });
    });
  });
  document.querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () =>
    activate(button.dataset.openTab, { focus: true, navigate: true, show: true })));
  window.addEventListener('popstate', () => activate(tabFromHash(), { show: true }));
  window.addEventListener('hashchange', () => activate(tabFromHash()));
  activate(tabFromHash());

  document.querySelectorAll('[data-site-image]').forEach(img => { img.src = asset(img.dataset.siteImage); });
  document.querySelectorAll('[data-count="creatures"]').forEach(el => { el.textContent = SITE_CONTENT.creatures; });
  document.querySelectorAll('[data-count="tribes"]').forEach(el => { el.textContent = Object.keys(SITE_CONTENT.tribes).length; });
  document.querySelectorAll('[data-count="masters"]').forEach(el => { el.textContent = SITE_CONTENT.masters.length; });
  document.querySelectorAll('[data-tribe-count]').forEach(el => { el.textContent = SITE_CONTENT.tribes[el.dataset.tribeCount] || '—'; });
  const masters = document.getElementById('master-list');
  SITE_CONTENT.masters.forEach(master => { const li = document.createElement('li'); li.textContent = master.name; masters.append(li); });

  function selectLocation(name) {
    const place = locations[name];
    if (!place) return;
    document.querySelectorAll('[data-location]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.location === name)));
    const picture = document.getElementById('world-art');
    picture.src = asset(place.art);
    picture.alt = 'Arte atual do jogo: ' + place.name;
    document.getElementById('world-tag').textContent = place.tag;
    document.getElementById('world-name').textContent = place.name;
    document.getElementById('world-title').textContent = place.name;
    document.getElementById('world-description').textContent = place.text;
    const list = document.getElementById('world-features');
    list.replaceChildren();
    place.items.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
  }
  document.querySelectorAll('[data-location]').forEach(button => button.addEventListener('click', () => selectLocation(button.dataset.location)));
  selectLocation('patio');

  document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-device]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    document.getElementById('controls-pc').hidden = button.dataset.device !== 'pc';
    document.getElementById('controls-mobile').hidden = button.dataset.device !== 'mobile';
  }));
  document.querySelectorAll('[data-play]').forEach(button => button.addEventListener('click', playNow));
})();
