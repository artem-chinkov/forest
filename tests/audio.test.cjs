const {test} = require('node:test');
const assert = require('node:assert/strict');
const {AudioQueue} = require('../demo/audio.js');
class FakeAudio extends EventTarget {
  constructor(pool) { super(); pool.push(this); this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  removeAttribute() {}
  load() {}
  end() { this.paused = true; this.dispatchEvent(new Event('ended')); }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() { const pool = [], clips = []; const q = new AudioQueue({url:id=>id, createAudio:()=>new FakeAudio(pool),onClip:id=>clips.push(id)}); return {q,pool,clips}; }
test('реплики воспроизводятся по очереди', async () => {
  const {q,pool,clips} = setup(); const result = q.play(['a','b']);
  assert.equal(pool.length, 1); pool[0].end(); await tick();
  assert.equal(pool.length, 2); pool[1].end();
  assert.equal((await result).status, 'ended'); assert.equal(q.playing, false);
  assert.deepEqual(clips.filter(Boolean), ['a','b']);
});
test('повтор прерывает предыдущую очередь без наложения и устаревшего продолжения', async () => {
  const {q,pool} = setup(); const old = q.play(['a','b']); const fresh = q.play(['c']);
  assert.equal(pool[0].paused, true); assert.equal((await old).status, 'cancelled');
  pool[0].end(); await tick(); assert.equal(pool.length, 2);
  pool[1].end(); assert.equal((await fresh).status, 'ended');
});
test('ошибка файла и отказ play возвращают явную ошибку и останавливают очередь', async () => {
  const {q,pool} = setup(); const pending = q.play(['missing','next']);
  pool[0].dispatchEvent(new Event('error'));
  assert.equal((await pending).status, 'error'); assert.equal(pool.length, 1); assert.equal(q.playing, false);
  const denied = new AudioQueue({url:id=>id,createAudio:()=>({addEventListener(){},removeEventListener(){},play:()=>Promise.reject(new Error('denied')),pause(){},removeAttribute(){},load(){}})});
  assert.equal((await denied.play(['a'])).status, 'error');
});
test('остановка не превращается в успешное завершение', async () => {
  const {q} = setup(); const pending = q.play(['a']); q.stop();
  assert.equal((await pending).status, 'cancelled'); assert.equal(q.playing, false);
});
