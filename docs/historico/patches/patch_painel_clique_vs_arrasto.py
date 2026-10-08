# -*- coding: utf-8 -*-
"""v2.34 / patch v171 — CLIQUE vs. ARASTO nos painéis móveis.

BUG (reportado com print do PORTAL DE VIAGEM): depois da v2.31 (painéis móveis),
não dá mais para selecionar nenhum mapa — ao clicar num .region-card o jogo "fica
querendo puxar" o painel e o travelTo() nunca dispara.

CAUSA: o script da v2.31 procurava a alça de arrasto só em
'h1,h2,h3,h4,.panel-title,.ck169-title,.ck170-title,.modal-title' e caía no
fallback `handle = el` (o PAINEL INTEIRO vira alça) quando não achava. É o caso
do #room-menu (cabeçalho .room-panel-header), do #mission-board-panel
(.mbp-header), do #scanner-real (.scanner-real-header) e do #clerk-panel antes
do primeiro render (vazio → sem .ck169-title). Com o painel inteiro como alça,
qualquer pointerdown fora de button/input dava preventDefault + setPointerCapture
no painel — o click no .region-card (uma DIV com onclick) morria ali.

CORREÇÃO (este patch, sem mudar nada no visual ou nas posições salvas):
 1. cada painel ganha sua alça REAL (.room-panel-header, .mbp-header,
    .scanner-real-header, .ck169-top, .ck170-top, h1-h4, ...);
 2. painel sem alça = painel fixo (NUNCA engole clique por fallback);
 3. arrasto só começa após mover 7px — clique simples passa 100% limpo
    (sem preventDefault e sem capture no pointerdown);
 4. touch-action:none sai do painel inteiro e vai SÓ para a alça (o conteúdo
    volta a rolar no celular);
 5. elementos clicáveis ([onclick], .region-card, .inv-slot, ...) nunca
    iniciam arrasto; após um arrasto real, 1 click fantasma é engolido.
"""
import io
import sys

ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

# ---------------------------------------------------------------- CSS
CSS_INI = '<style id="movable-panels-style">'
CSS_FIM = '</style>'
CSS_NOVO = (
    '<style id="movable-panels-style">\n'
    '.movable-panel{user-select:none;-webkit-user-select:none}'
    '.movable-panel input,.movable-panel textarea{user-select:text;-webkit-user-select:text}'
    ".movable-panel::before{content:'⠿';position:absolute;top:8px;left:10px;color:#8ef3ff;opacity:.65;font-size:14px;z-index:20;pointer-events:none}"
    '.movable-panel.is-dragging{cursor:grabbing!important;z-index:9999!important;box-shadow:0 12px 40px rgba(0,0,0,.55),0 0 24px rgba(0,230,255,.25)!important}'
    '.movable-panel .panel-drag-handle{cursor:grab;touch-action:none}\n'
    '</style>'
)

i = s.find(CSS_INI)
j = s.find(CSS_FIM, i) + len(CSS_FIM) if i != -1 else -1
if i == -1 or j <= i:
    print('ABORTADO: bloco CSS movable-panels-style não encontrado')
    sys.exit(1)
bloco_css_velho = s[i:j]
if 'touch-action:none;user-select:none' not in bloco_css_velho:
    print('AVISO: CSS já parece corrigido — pulando CSS')
else:
    s = s[:i] + CSS_NOVO + s[j:]
    print('ok: CSS (touch-action só na alça, inputs selecionáveis)')

# ------------------------------------------------------------- JS v2.31
JS_INI = '<script>\n/* v2.31 — painéis móveis'
JS_FIM = '})();\n</script></body>'
JS_NOVO = '''<script>
/* v2.34 (v171) — painéis móveis CORRIGIDO: arrastar SÓ pela alça do cabeçalho + clique vs. arrasto.
 * Corrige o bug da v2.31 onde painéis sem h1-h4/.panel-title (#room-menu, missões,
 * scanner, clerk antes do render) caíam no fallback `handle = el` (painel INTEIRO virava
 * alça): o pointerdown dava preventDefault + setPointerCapture em qualquer clique,
 * então clicar num mapa do Portal de Viagem só "puxava" o painel e o travelTo() nunca
 * disparava. Agora: (1) alças reais de cada painel; (2) sem alça = sem arrasto (nunca
 * quebra clique); (3) arrasto só após mover 7px (clique simples passa limpo);
 * (4) touch-action:none só na alça (conteúdo rola no celular); (5) elementos
 * interativos ([onclick], .region-card etc.) nunca iniciam arrasto. */
(function(){
  var SELECTOR='#clerk-panel, #mission-board-panel, #scanner-real, #options-panel, #room-menu, #codex-panel, .panel.large-panel, .modal-panel';
  var HANDLE_SEL='h1,h2,h3,h4,.panel-title,.panel-header,.modal-title,.modal-header,.room-panel-header,.mbp-header,.scanner-real-header,.ck169-top,.ck170-top,.ck169-title,.ck170-title';
  var NO_DRAG='button,input,select,textarea,a,[data-no-drag],[onclick],.region-card,.inv-slot,.gadget-card,.mission-card,.lm-tag';
  var KEY='chaotic_panel_positions_v231'; // mesma chave: mantém posições que o jogador salvou
  var LIMIAR=7; // px — abaixo disso é CLIQUE, não arrasto
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function save(p){try{localStorage.setItem(KEY,JSON.stringify(p))}catch(e){}}
  var pos=load();
  function findHandle(el){try{return el.querySelector(HANDLE_SEL)}catch(e){return null}}
  function tagHandle(el){var h=findHandle(el);if(h&&!h.classList.contains('panel-drag-handle')){try{h.classList.add('panel-drag-handle')}catch(e){}}}
  function make(el){
    if(!el||el.dataset.movable==='1')return;
    el.dataset.movable='1';el.classList.add('movable-panel');
    var id=el.id||('panel_'+Math.random().toString(36).slice(2));el.dataset.moveId=id;
    if(pos[id]){el.style.left=pos[id].left+'px';el.style.top=pos[id].top+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='none'}
    tagHandle(el);
    var pend=null; // {x,y,left,top,moved,pid} — arrasto PENDENTE (só confirma após o limiar)
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==undefined&&e.button!==0)return;
      if(e.target&&e.target.closest){try{if(e.target.closest(NO_DRAG))return}catch(ee){}} // coisa clicável: nunca arrasta
      var handle=findHandle(el); // alça resolvida NA HORA (painel dinâmico como o clerk entra aqui)
      if(!handle)return; // sem alça = painel fixo (seguro: nunca engole clique)
      if(!handle.contains(e.target))return; // fora da alça = clique normal
      var r=el.getBoundingClientRect();
      pend={x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false,pid:e.pointerId};
      // SEM preventDefault e SEM capture aqui: o clique simples precisa passar limpo.
    });
    function move(e){
      if(!pend)return;
      if(e.pointerId!==undefined&&pend.pid!==undefined&&e.pointerId!==pend.pid)return;
      var dx=e.clientX-pend.x,dy=e.clientY-pend.y;
      if(!pend.moved){
        if(Math.sqrt(dx*dx+dy*dy)<LIMIAR)return; // ainda é clique
        pend.moved=true;el.classList.add('is-dragging');
        try{if(el.setPointerCapture&&pend.pid!==undefined)el.setPointerCapture(pend.pid)}catch(err){}
      }
      if(e.cancelable)e.preventDefault();
      var l=pend.left+dx,t=pend.top+dy,m=8;
      l=Math.max(m,Math.min(window.innerWidth-el.offsetWidth-m,l));
      t=Math.max(m,Math.min(window.innerHeight-el.offsetHeight-m,t));
      el.style.left=l+'px';el.style.top=t+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='none';
    }
    function up(e){
      if(!pend)return;
      if(e.pointerId!==undefined&&pend.pid!==undefined&&e.pointerId!==pend.pid)return;
      var foiArrasto=pend.moved;
      pend=null;el.classList.remove('is-dragging');
      if(foiArrasto){
        pos[id]={left:parseFloat(el.style.left),top:parseFloat(el.style.top)};save(pos);
        // o pointerup após arrasto geraria um 'click' fantasma: engole UM clique no painel.
        var trava=function(ev){try{ev.stopPropagation();ev.preventDefault()}catch(ee){}try{el.removeEventListener('click',trava,true)}catch(eee){}};
        try{el.addEventListener('click',trava,true)}catch(eeee){}
        setTimeout(function(){try{el.removeEventListener('click',trava,true)}catch(e2){}},80);
      }
    }
    function cancel(e){
      if(!pend)return;
      if(e.pointerId!==undefined&&pend.pid!==undefined&&e.pointerId!==pend.pid)return;
      pend=null;el.classList.remove('is-dragging');
    }
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',cancel);
    if(window&&window.addEventListener){ // não perde o arrasto se o ponteiro sair do painel
      window.addEventListener('pointermove',move,true);
      window.addEventListener('pointerup',up,true);
      window.addEventListener('pointercancel',cancel,true);
    }
  }
  function scan(){try{document.querySelectorAll(SELECTOR).forEach(function(el){make(el);tagHandle(el)})}catch(e){}}
  window.resetMovablePanels=function(){try{localStorage.removeItem(KEY)}catch(e){}location.reload()};
  scan();
  try{if(document.body) new MutationObserver(scan).observe(document.body,{childList:true,subtree:true})}catch(e){}
})();
</script></body>'''

i = s.find(JS_INI)
j = s.find(JS_FIM, i) + len(JS_FIM) if i != -1 else -1
if 'v2.34 (v171)' in s and (i == -1 or 'v2.34 (v171)' in s[i:j]):
    print('AVISO: JS já corrigido (v171) — pulando JS')
elif i != -1 and j > i:
    s = s[:i] + JS_NOVO + s[j:]
    print('ok: JS v2.31 → v2.34 (alças reais + limiar de 7px)')
else:
    print('ABORTADO: script v2.31 dos painéis móveis não encontrado')
    sys.exit(1)

# --------------------------------------------------------------- título
VELHO_T = '<title>Chaotic.idleWorld v2.33 — FORJA-7 nova: os 3 fragmentos da Drome Key 🔑</title>'
NOVO_T = '<title>Chaotic.idleWorld v2.34 — Clique vs. arrasto nos painéis (Portal de Viagem) 🖱️</title>'
if s.count(VELHO_T) == 1:
    s = s.replace(VELHO_T, NOVO_T, 1)
    print('ok: título v2.33 → v2.34')
elif NOVO_T in s:
    print('AVISO: título já em v2.34 — pulando')
else:
    print('AVISO: título não encontrado — pulando')

# ------------------------------------------------------------- changelog
VELHO_C = '// CHAOTIC.IDLEWORLD v2.33 — CHANGELOG (v170 FORJA-7 nova)'
NOVO_C = ('''// ============================================================
// CHAOTIC.IDLEWORLD v2.34 — CHANGELOG (v171 Clique vs. arrasto nos painéis)
// - v171 — CORREÇÃO: o clique nos mapas do PORTAL DE VIAGEM voltou a funcionar.
//   A v2.31 (painéis móveis) caía no fallback "painel inteiro = alça" nos painéis
//   cujo cabeçalho não era h1-h4/.panel-title (#room-menu, missões, scanner e o
//   clerk antes do render): qualquer clique dava preventDefault + capture e só
//   "puxava" o painel — o travelTo() nunca disparava. Agora cada painel tem sua
//   alça real (.room-panel-header, .mbp-header, .scanner-real-header, .ck169-top,
//   .ck170-top...), sem alça não há arrasto, e o arrasto só começa após mover 7px
//   (clique simples passa limpo). touch-action:none só na alça: o conteúdo rola
//   no celular. Clicáveis ([onclick], .region-card etc.) nunca arrastam.
// ============================================================
// CHAOTIC.IDLEWORLD v2.33 — CHANGELOG (v170 FORJA-7 nova)''')
if s.count(VELHO_C) == 1 and 'v2.34 — CHANGELOG (v171' not in s:
    s = s.replace(VELHO_C, NOVO_C, 1)
    print('ok: changelog v171')
else:
    print('AVISO: changelog já aplicado ou âncora ausente — pulando')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
