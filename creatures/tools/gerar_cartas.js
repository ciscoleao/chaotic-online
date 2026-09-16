#!/usr/bin/env node
/* ============================================================
 * Chaotic.IdleWorld — GERADOR DO VISUALIZADOR DE CARTAS
 * tools/gerar_cartas.js  →  node tools/gerar_cartas.js
 * ------------------------------------------------------------
 * Lê data/creatures.json e escreve cartas.html (arquivo único,
 * CSS+JS embutidos, sem nenhuma requisição externa).
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const banco = JSON.parse(fs.readFileSync(path.join(raiz, 'data', 'creatures.json'), 'utf8'));
const C = require(path.join(raiz, 'src', 'creature.js'));

const dados = JSON.stringify(banco);
const meta = JSON.stringify({
  tribos: C.TRIBE_META, mapas: C.MAPS, elementos: C.ELEMENTS, cores: C.ELEMENT_COLORS,
  arquétipos: C.ARCHETYPES, danoScale: C.DANO_SCALE, rareMult: C.RARE_MULT
});

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chaotic.IdleWorld — Banco de Criaturas (120)</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;background:#0a0e13;color:#e8eef5;
       font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
  header{position:sticky;top:0;z-index:5;background:linear-gradient(#131a23,#0d131a);
         border-bottom:2px solid #d9a441;padding:10px 14px}
  h1{margin:0 0 2px;font-size:17px;letter-spacing:.4px}
  h1 b{color:#d9a441}
  .sub{color:#8fa2b5;font-size:11.5px}
  .filtros{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;align-items:center}
  select,input,button{background:#182230;color:#e8eef5;border:1px solid #2b3a4d;border-radius:6px;
        padding:5px 8px;font:inherit;font-size:12px}
  button{cursor:pointer}
  button:hover{border-color:#d9a441}
  button.on{background:#2a2113;border-color:#d9a441;color:#ffd980}
  .kpis{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;font-size:11.5px;color:#9fb0c2}
  .kpis b{color:#ffd980}
  main{padding:14px}
  h2{font-size:13px;margin:20px 0 8px;color:#ffd980;border-left:3px solid #d9a441;padding-left:8px}
  h2 span{color:#8fa2b5;font-weight:400;font-size:11.5px}
  .grade{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(248px,1fr))}
  .carta{background:linear-gradient(#141c26,#0f151d);border:1px solid #26333f;border-radius:10px;
         padding:9px 10px;position:relative;overflow:hidden;display:flex;flex-direction:column}
  .carta:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--cor)}
  .carta.rara{border-color:#d9a441;box-shadow:0 0 0 1px #d9a44155,0 3px 14px #00000066}
  .topo{display:flex;justify-content:space-between;gap:6px;align-items:flex-start}
  .nome{font-size:13.5px;font-weight:700;color:#fff;margin:2px 0 3px}
  .tag{font-size:9.5px;padding:1px 5px;border-radius:4px;border:1px solid #33445a;color:#9fb0c2;white-space:nowrap}
  .tag.rar{background:#3a2a06;border-color:#d9a441;color:#ffd980}
  .tag.agr{background:#3a1013;border-color:#c8434f;color:#ff9aa5}
  .tag.pas{background:#102a1c;border-color:#3f9a46;color:#9be3a4}
  .tag.exc{background:#221636;border-color:#7a5cc4;color:#c9b6ff}
  .elementos{display:flex;gap:4px;margin:6px 0 7px;flex-wrap:wrap}
  .el{font-size:10px;padding:1px 6px;border-radius:999px;font-weight:700;color:#0a0e13}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:7px}
  .st{background:#0d141c;border:1px solid #202c38;border-radius:6px;padding:4px;text-align:center}
  .st i{display:block;font-style:normal;font-size:9.5px;color:#8fa2b5;letter-spacing:.5px}
  .st b{font-size:14px;color:#fff}
  .barra{height:3px;border-radius:2px;background:#1d2733;margin-top:3px;overflow:hidden}
  .barra i{display:block;height:100%;background:#4a8fd8}
  .c0 .barra i{background:#c8434f}
  .c1 .barra i{background:#4a8fd8}
  .c2 .barra i{background:#9a7fd0}
  .linha{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#9fb0c2;margin:3px 0;white-space:nowrap}
  .linha b{color:#e8eef5}
  .linha.alta{align-items:baseline}
  .mugic{letter-spacing:1px;color:#c9b6ff;font-size:11.5px;white-space:nowrap}
  .hab{margin-top:6px;padding-top:6px;border-top:1px dashed #26333f;font-size:11px;color:#b9c8d6}
  .hab b{color:#7fd0ff}
  .rodape{margin-top:auto;padding-top:7px;font-size:10.5px;color:#7d8fa1;display:flex;flex-direction:column;gap:1px;border-top:1px solid #1a232d}
  .tabelas{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:6px}
  table{width:100%;border-collapse:collapse;font-size:11.5px;background:#101720;border:1px solid #26333f;border-radius:8px;overflow:hidden}
  th,td{padding:4px 7px;border-bottom:1px solid #1b232d;text-align:right}
  th:first-child,td:first-child{text-align:left}
  th{background:#151f2b;color:#9fb0c2;font-weight:600}
  tr:last-child td{border-bottom:0}
  .oculto{display:none}
  footer{padding:18px 14px 40px;color:#7d8fa1;font-size:11px}
  code{background:#141c26;padding:1px 5px;border-radius:4px;color:#ffd980}
</style>
</head>
<body>
<header>
  <h1>Chaotic.IdleWorld · <b>Banco de Criaturas</b> — 120 criaturas (4 tribos × 5 + 10 + 15)</h1>
  <div class="sub">mapa 1: 5 passivas · mapa 2: 6 passivas + 4 agressivas (1 rara) · mapa 3: 7 passivas + 8 agressivas (2 raras) — rara = +20% em velocidade e dano, mugic inversamente proporcional à força</div>
  <div class="filtros">
    <select id="fTribo"><option value="">Todas as tribos</option></select>
    <select id="fMapa"><option value="">Todos os mapas</option><option value="1">Mapa 1 — Nv.1-5</option><option value="2">Mapa 2 — Nv.10</option><option value="3">Mapa 3 — Nv.20</option></select>
    <select id="fElem"><option value="">Todos os elementos</option></select>
    <button data-perfil="passivas">passivas</button>
    <button data-perfil="agressivas">agressivas</button>
    <button data-perfil="raras">só raras</button>
    <button data-perfil="excecao">exceção de lore</button>
    <input id="busca" placeholder="buscar por nome…" size="18">
    <button id="limpar">limpar</button>
  </div>
  <div class="kpis" id="kpis"></div>
</header>
<main>
  <div id="saida"></div>
  <h2>Resumo por tribo e mapa <span>(gerado do próprio banco)</span></h2>
  <div class="tabelas" id="tabelas"></div>
</main>
<footer>
  Arquivo único, sem requisições externas — abre direto no navegador. Dados de <code>data/creatures.json</code>,
  modelo em <code>src/creature.js</code>, pools em <code>src/spawn_manager.js</code>.
  Dano por golpe = power × fator da tribo × <span id="escala"></span> (escala de combate) e rara ×1,2.
</footer>

<script>
const DB = ${dados};
const META = ${meta};

const ELCOR = META.cores;
const MAXSTAT = 220;
const cartas = document.querySelector('#saida');
const kpis = document.querySelector('#kpis');
const tabelas = document.querySelector('#tabelas');
let filtro = { tribo: '', mapa: '', elem: '', perfil: '', busca: '' };

document.querySelector('#escala').textContent = META.danoScale;

// ---------- selects ----------
Object.keys(META.tribos).forEach(t => {
  const o = document.createElement('option'); o.value = t; o.textContent = t; document.querySelector('#fTribo').appendChild(o);
});
META.elementos.forEach(e => {
  const o = document.createElement('option'); o.value = e; o.textContent = e; document.querySelector('#fElem').appendChild(o);
});

// ---------- render ----------
function passa(c) {
  if (filtro.tribo && c.tribe !== filtro.tribo) return false;
  if (filtro.mapa && String(c.mapLevel) !== filtro.mapa) return false;
  if (filtro.elem && c.elements.indexOf(filtro.elem) === -1) return false;
  if (filtro.busca && c.name.toLowerCase().indexOf(filtro.busca.toLowerCase()) === -1) return false;
  if (filtro.perfil === 'passivas' && c.isAggressive) return false;
  if (filtro.perfil === 'agressivas' && !c.isAggressive) return false;
  if (filtro.perfil === 'raras' && !c.isRare) return false;
  if (filtro.perfil === 'excecao' && c.elementKind !== 'excecao') return false;
  return true;
}

function carta(c) {
  const el = c.elements.map(e => \`<span class="el" style="background:\${ELCOR[e]}">\${e}</span>\`).join('');
  const mugic = c.mugicCounters === 0 ? '<span style="color:#7d8fa1">nenhum · muito forte</span>'
    : '<span style="color:#c9b6ff">' + '◆'.repeat(c.mugicCounters) + '</span> <span style="color:#8fa2b5">' + c.mugicCounters + ' de 2</span>';
  const tags = [
    c.isRare ? '<span class="tag rar">RARA</span>' : '',
    c.isAggressive ? '<span class="tag agr">agressiva</span>' : '<span class="tag pas">passiva</span>',
    c.elementKind === 'excecao' ? '<span class="tag exc">exceção de lore</span>' : ''
  ].join(' ');
  const st = k => \`<div class="st c\${c.mugicCounters}"><i>\${k[0]}</i><b>\${c.stats[k[1]]}</b>
      <div class="barra"><i style="width:\${Math.min(100, c.stats[k[1]] / MAXSTAT * 100)}%"></i></div></div>\`;
  return \`<div class="carta\${c.isRare ? ' rara' : ''}" style="--cor:\${c.tint}">
    <div class="topo">
      <div>
        <div class="sub">\${c.tribe} · \${META.tribos[c.tribe].principal.join('/')}</div>
        <div class="nome">\${c.name}</div>
      </div>
      <div style="text-align:right"><div class="tag">m\${c.mapLevel}</div><div class="sub">Nv.\${c.level}</div></div>
    </div>
    <div class="elementos">\${el} \${tags}</div>
    <div class="stats">\${st(['COR', 'courage'])}\${st(['POD', 'power'])}\${st(['SAB', 'wisdom'])}\${st(['VEL', 'speed'])}</div>
    <div class="linha alta"><span>mugic</span><span class="mugic">\${mugic}</span></div>
    <div class="linha"><span>velocidade no mapa</span><b>\${c.baseSpeed} px/s</b></div>
    <div class="linha"><span>dano por golpe</span><b>\${c.baseDamage}\${c.isRare ? ' <span style="color:#ffd980">(+20%)</span>' : ''}</b></div>
    <div class="hab"><b>\${c.ability.name}</b> · \${c.ability.type} · \${c.ability.manaCost} de mana<br>\${c.ability.desc}</div>
    <div class="rodape"><span>status totais <b style="color:#b9c8d6">\${c.totalStats}</b> · \${c.powerTier}</span><span>xp \${c.rewards.xp} · bits \${c.rewards.bits[0]}–\${c.rewards.bits[1]} · arte \${c.art}</span></div>
  </div>\`;
}

function render() {
  const lista = DB.filter(passa);
  const tribos = Object.keys(META.tribos);
  let html = '';
  tribos.forEach(t => {
    [1, 2, 3].forEach(m => {
      const grupo = lista.filter(c => c.tribe === t && c.mapLevel === m);
      if (!grupo.length) return;
      html += \`<h2>\${t} · Mapa \${m} <span>Nv.\${META.mapas[m].requiredLevel} · \${grupo.length} de \${META.mapas[m].slots} criaturas\${filtro.tribo || filtro.mapa || filtro.elem || filtro.perfil || filtro.busca ? ' (filtradas)' : ''}</span></h2>\`;
      html += '<div class="grade">' + grupo.map(carta).join('') + '</div>';
    });
  });
  cartas.innerHTML = html || '<p class="sub">Nenhuma criatura com esses filtros.</p>';

  const pas = lista.filter(c => !c.isAggressive).length;
  const agr = lista.filter(c => c.isAggressive).length;
  const rar = lista.filter(c => c.isRare).length;
  const exc = lista.filter(c => c.elementKind === 'excecao').length;
  const elc = {};
  lista.forEach(c => c.elements.forEach(e => elc[e] = (elc[e] || 0) + 1));
  kpis.innerHTML = \`<span>exibindo <b>\${lista.length}</b> de \${DB.length}</span>
    <span>passivas <b>\${pas}</b></span><span>agressivas <b>\${agr}</b></span>
    <span>raras <b>\${rar}</b></span><span>exceções de lore <b>\${exc}</b></span>
    <span>elementos: \${Object.keys(elc).map(e => \`<b>\${e}</b> \${elc[e]}\`).join(' · ')}</span>\`;
}

function montarTabelas() {
  let html = '';
  Object.keys(META.tribos).forEach(t => {
    const linhas = [1, 2, 3].map(m => {
      const pool = DB.filter(c => c.tribe === t && c.mapLevel === m);
      const pas = pool.filter(c => !c.isAggressive).length;
      const agr = pool.filter(c => c.isAggressive).length;
      const rar = pool.filter(c => c.isRare).length;
      const med = k => Math.round(pool.reduce((s, c) => s + c.stats[k], 0) / pool.length);
      const exc = pool.filter(c => c.elementKind === 'excecao').length;
      return \`<tr><td>Mapa \${m} (Nv.\${META.mapas[m].requiredLevel})</td><td>\${pool.length}</td><td>\${pas}</td><td>\${agr}</td><td>\${rar}</td>
        <td>\${med('courage')}</td><td>\${med('power')}</td><td>\${med('wisdom')}</td><td>\${med('speed')}</td><td>\${exc}</td></tr>\`;
    }).join('');
    html += \`<table><thead><tr><th>\${t}</th><th>criaturas</th><th>pass.</th><th>agres.</th><th>raras</th>
      <th>COR</th><th>POD</th><th>SAB</th><th>VEL</th><th>exceç.</th></tr></thead><tbody>\${linhas}</tbody></table>\`;
  });
  tabelas.innerHTML = html;
}

// ---------- eventos ----------
document.querySelector('#fTribo').onchange = e => { filtro.tribo = e.target.value; render(); };
document.querySelector('#fMapa').onchange = e => { filtro.mapa = e.target.value; render(); };
document.querySelector('#fElem').onchange = e => { filtro.elem = e.target.value; render(); };
document.querySelector('#busca').oninput = e => { filtro.busca = e.target.value; render(); };
document.querySelectorAll('button[data-perfil]').forEach(b => {
  b.onclick = () => {
    const v = b.dataset.perfil;
    const ligado = document.querySelector('button[data-perfil].on') === b;
    document.querySelectorAll('button[data-perfil]').forEach(x => x.classList.remove('on'));
    if (!ligado) { b.classList.add('on'); filtro.perfil = v; } else { filtro.perfil = ''; }
    render();
  };
});
document.querySelector('#limpar').onclick = () => {
  filtro = { tribo: '', mapa: '', elem: '', perfil: '', busca: '' };
  document.querySelectorAll('select').forEach(s => s.value = '');
  document.querySelector('#busca').value = '';
  document.querySelectorAll('button[data-perfil]').forEach(x => x.classList.remove('on'));
  render();
};

render();
montarTabelas();
</script>
</body>
</html>
`;

const saida = path.join(raiz, 'cartas.html');
fs.writeFileSync(saida, html, 'utf8');
console.log('cartas.html gerado: ' + (fs.statSync(saida).size / 1024).toFixed(1) + ' KB · ' + banco.length + ' cartas embutidas');
