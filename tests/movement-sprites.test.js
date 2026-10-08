const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const { patchMovementSprites } = require('../server/movement-sprites');
const html = patchMovementSprites(fs.readFileSync(path.join(root, 'game/index.html'), 'utf8'));
const directions = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
function section(start, end) { return html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start))); }
function context(extra = {}) {
  const ctx = vm.createContext({ GameState: { player: { avatar: 'male' } }, ...extra });
  vm.runInContext(section('const MAIN_HERO_DIRECTIONS =', 'function createPlayableHeroTextures'), ctx);
  vm.runInContext(section('function playableHeroKey(', '// BOOT SCENE'), ctx);
  return ctx;
}

test('both atlases contain eight native 64px columns and seven rows', () => {
  for (const sex of ['m', 'f']) {
    const png = fs.readFileSync(path.join(root, `site/assets/hero-${sex}-atlas.png`));
    assert.equal(png.readUInt32BE(16), 512);
    assert.equal(png.readUInt32BE(20), 448);
    assert.equal(png[25], 6, 'PNG must retain RGBA transparency');
  }
});

test('native textures keep the previous world size and collision footprint', () => {
  const ctx = context();
  const spec = vm.runInContext('MAIN_HERO_SPRITE', ctx);
  assert.equal(spec.w * spec.scale, 60);
  assert.equal(spec.h * spec.scale, 60);
  assert.equal(spec.body.w * spec.scale, 20);
  assert.equal(spec.body.h * spec.scale, 15);
  assert.equal(spec.body.ox * spec.scale, 20);
  assert.equal(spec.body.oy * spec.scale, 43.75);
});

test('walking keeps all six poses, direction changes preserve phase, stop returns to idle', () => {
  for (const avatar of ['male', 'female']) {
    const ctx = context();
    ctx.GameState.player.avatar = avatar;
    const prefix = avatar === 'male' ? 'githubMale_' : 'femaleHero_';
    const sprite = { scene: { textures: { exists: () => true } }, texture: { key: '' },
      setTexture(key) { this.texture.key = key; } };
    const state = {}; // Some scenes do not initialize animation timers.
    const pose = (dir, moving, delta) => ctx.setMainHeroPose(sprite, state, dir, 'frame', 'timer', moving, delta);
    pose('s', true, 0);
    assert.equal(sprite.texture.key, prefix + 's_1');
    const poses = [];
    for (let i = 0; i < 6; i++) {
      poses.push(state.frame);
      pose('s', true, 200);
    }
    assert.deepEqual(poses, [1, 2, 3, 4, 5, 6]);
    pose('e', true, 99);
    assert.equal(state.frame, 1);
    pose('ne', true, 101);
    assert.equal(sprite.texture.key, prefix + 'ne_2');
    pose('ne', true, 1200);
    assert.equal(state.frame, 2, 'Full loop must return to the same pose');
    pose('ne', false, 0);
    assert.equal(sprite.texture.key, prefix + 'ne_0');
    assert.equal(state.timer, 0);
    pose('ne', true, NaN);
    assert.equal(state.frame, 1);
    assert.equal(state.timer, 0);
  }
});

test('all eight velocity sectors select the corresponding direction', () => {
  const ctx = context();
  [[0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1], [-1,0], [-1,1]]
    .forEach(([x,y], i) => assert.equal(ctx.mainHeroDirection(x,y), directions[i]));
});

test('textures crop native and classic atlases into isolated cells without frame bleed', () => {
  for (const cell of [64, 48]) {
    const calls = [], keys = new Set();
    const image = { width: cell * 8, height: cell * 7 };
    const ctx = context({
      setTextureSampling242: (scene, key, filter) => assert.equal(filter, 'pixel'),
      document: { createElement() {
        const canvas = { width: 0, height: 0 };
        const draw = { clearRect(){}, save(){}, beginPath(){}, rect(){}, clip(){}, restore(){},
          drawImage(...args) { calls.push({ args, canvas }); } };
        canvas.getContext = () => draw;
        return canvas;
      } }
    });
    vm.runInContext(section('function createPlayableHeroTextures(', 'const FEMALE_EAST_SHEET_DATA'), ctx);
    const scene = { textures: {
      get: () => ({ key: 'atlas', getSourceImage: () => image }),
      exists: key => keys.has(key), addCanvas: key => keys.add(key)
    } };
    ctx.createPlayableHeroTextures(scene, 'atlas', 'githubMale_', 6);
    assert.equal(keys.size, 56);
    assert.equal(new Set(calls.map(c => c.canvas)).size, 56);
    calls.forEach(({ args, canvas }, i) => {
      assert.deepEqual(args.slice(1), [Math.floor(i / 7) * cell, (i % 7) * cell, cell, cell, 0, 0, 64, 64]);
      assert.equal(canvas.width, 64);
      assert.equal(canvas.height, 64);
    });
  }
});
