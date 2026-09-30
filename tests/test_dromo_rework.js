// Verificações estáticas do rework do Dromo.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'docs', 'dromo', 'Dromo_Battle_Rework.html');
const source = fs.readFileSync(sourcePath, 'utf8');
let ok = 0;
function check(name, condition) {
  assert.ok(condition, name);
  console.log('  ✅ ' + name);
  ok++;
}
function embedded(file) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const m = html.match(/window\.BATTLE_GAME_B64="([^"]+)"/);
  assert.ok(m, 'BATTLE_GAME_B64 ausente em ' + file);
  return Buffer.from(m[1], 'base64').toString('utf8');
}

function checkEmbeddedFile(file, label) {
  const full = path.resolve(root, file);
  if (!fs.existsSync(full)) return;
  check(label + ' recebe o Dromo refeito', embedded(file) === source);
  const html = fs.readFileSync(full, 'utf8');
  check(label + ' envia o avatar do jogador', html.includes("hero: { kind: GameState.player.avatar || 'male'"));
}

console.log('== Dromo rework ==');
check('formação em linhas', ['FORMAÇÃO TÁTICA', 'FRENTE', 'MEIO', 'RETAGUARDA', 'aliveLane', 'canEngage'].every(x => source.includes(x)));
check('seleção com busca, tribo, elemento e ordenação', ['dromo-monster-toolbar', 'dromo-monster-search', 'dromo-monster-tribe', 'data-monster-element', 'dromo-monster-order'].every(x => source.includes(x)));
check('abas Battlegear/Mugic', ['dromo-equipment-tabs', 'BATTLEGEAR', 'MUGIC'].every(x => source.includes(x)));
check('mapas com filtros e dados táticos', ['MAP_TACTICS', 'dromo-map-filters', 'map-meters', 'dromo-roulette-board', 'RESULTADO DO SORTEIO'].every(x => source.includes(x)));
check('cartas de confronto e bloqueio de linha', ['matchup-card', 'ALVO PROTEGIDO PELA LINHA', 'Regra de formação'].every(x => source.includes(x)));
check('mesma regra validada no PVP', source.includes('window.DromoRework.canEngage'));
check('transformação com aura e sprite do personagem', ['transform-aura', 'auraDescend', 'transform-hero', 'transform-creature'].every(x => source.includes(x)));
check('transformação não usa o emoji antigo do avatar', !source.includes('🧑‍🚀'));
check('avatar do jogador é enviado ao iframe', fs.readFileSync(path.join(root, 'Chaotic_Online_Lobby_FIX.html'), 'utf8').includes('hero: { kind:'));
check('avatar chega no export v238 servido', fs.readFileSync(path.join(root, 'Chaotic-Online-v238.html'), 'utf8').includes('hero: { kind:'));
check('cópia embarcada no lobby principal', embedded('Chaotic_Online_Lobby_FIX.html') === source);
check('cópia embarcada no index standalone', embedded('index.html') === source);
checkEmbeddedFile('Chaotic-Online-v238.html', 'HTML v238 publicado');
checkEmbeddedFile(path.join('..', 'upload', 'Chaotic-Online-v238(1).html'), 'HTML v238 mais atual');
for (const m of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  if (m[1].trim()) new Function(m[1]);
}
check('scripts do Dromo passam pelo parser JavaScript', true);
console.log('RESULTADO: ' + ok + ' ok, 0 falhas');
