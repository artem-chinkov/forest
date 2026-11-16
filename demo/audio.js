(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ForestAudio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  class AudioQueue {
    constructor({ url, createAudio, onClip = () => {}, onState = () => {}, timeout = 20000 }) {
      const shared = createAudio ? null : new Audio();
      Object.assign(this, { url, createAudio: createAudio || (() => shared), onClip, onState, timeout });
      this.generation = 0; this.current = null; this.cancelCurrent = null; this.playing = false;
    }
    stop() {
      this.generation++;
      if (this.cancelCurrent) this.cancelCurrent();
      if (this.current) { this.current.pause(); this.current.removeAttribute('src'); this.current.load(); }
      this.current = null; this.cancelCurrent = null; this.playing = false;
      this.onClip(null); this.onState(false);
    }
    async play(ids) {
      this.stop(); const generation = this.generation;
      this.playing = true; this.onState(true);
      try {
        for (const id of ids) {
          if (generation !== this.generation) return { status: 'cancelled' };
          const finished = await this.one(id);
          if (!finished || generation !== this.generation) return { status: 'cancelled' };
        }
        if (generation === this.generation) {
          this.playing = false; this.current = null; this.onClip(null); this.onState(false);
        }
        return { status: 'ended' };
      } catch (error) {
        if (generation !== this.generation) return { status: 'cancelled' };
        this.stop(); return { status: 'error', error };
      }
    }
    one(id) {
      const audio = this.createAudio(); this.current = audio;
      return new Promise((resolve, reject) => {
        let settled = false;
        const clean = () => { clearTimeout(timer); audio.removeEventListener('ended', end); audio.removeEventListener('error', fail); if (this.current === audio) this.cancelCurrent = null; };
        const finish = (ok, error) => { if (settled) return; settled = true; clean(); if (error) reject(error); else resolve(ok); };
        const end = () => finish(true);
        const fail = () => finish(false, new Error('audio-unavailable:' + id));
        const timer = setTimeout(fail, this.timeout);
        this.cancelCurrent = () => finish(false);
        audio.addEventListener('ended', end); audio.addEventListener('error', fail);
        audio.preload = 'auto'; audio.src = this.url(id); this.onClip(id);
        try { Promise.resolve(audio.play()).catch(error => finish(false, error)); }
        catch (error) { finish(false, error); }
      });
    }
  }
  return { AudioQueue };
});
