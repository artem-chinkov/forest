(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ForestSoundscape=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const files=Object.freeze({tap:'tap.wav',pack:'pack.wav',return:'return.wav',send:'send.wav',catch:'catch.wav',envelope:'envelope.wav',reward:'reward.wav',music:'music.mp3'});
  class Soundscape {
    constructor({url,createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),fetcher=(...args)=>fetch(...args),onState=()=>{}}){
      Object.assign(this,{url,createContext,fetcher,onState});this.context=null;this.unlocked=false;this.musicEnabled=true;this.effectsEnabled=true;this.phase='welcome';this.voice=false;this.paused=false;this.hidden=false;this.rewardReady=false;this.buffers=new Map();this.loads=new Map();this.effects=new Set();this.music=null;this.generation=0;this.failed=new Set();this.waits=new Set();
    }
    snapshot(){return{musicEnabled:this.musicEnabled,effectsEnabled:this.effectsEnabled,unlocked:this.unlocked,phase:this.phase,voice:this.voice,paused:this.paused,hidden:this.hidden,musicPlaying:!!this.music,effectsPlaying:this.effects.size,failed:[...this.failed]};}
    changed(){this.onState(this.snapshot());}
    unlock(){
      try{if(!this.context||this.context.state==='closed'){this.stopAll();this.context=this.createContext();this.loads.clear();this.context.addEventListener?.('statechange',()=>{this.unlocked=this.context.state==='running';if(!this.unlocked)this.stopAll();this.changed();if(this.unlocked)this.syncMusic();});}
        const resumed=this.context.resume();
        Promise.resolve(resumed).then(()=>{this.unlocked=this.context.state==='running';this.changed();this.syncMusic();}).catch(()=>{});
        for(const id of Object.keys(files))void this.load(id);
      }catch(_){/* Decorative audio is optional; keep the voice and lesson available. */}
    }
    load(id){
      if(!files[id]||!this.context)return Promise.resolve(null);
      if(this.buffers.has(id))return Promise.resolve(this.buffers.get(id));
      if(this.loads.has(id))return this.loads.get(id);
      const pending=(async()=>{try{const r=await this.fetcher(this.url(files[id]));if(!r.ok)throw Error('sound-file');const b=await this.context.decodeAudioData(await r.arrayBuffer());this.buffers.set(id,b);this.failed.delete(id);this.changed();return b;}catch(_){this.failed.add(id);this.changed();return null;}})().finally(()=>this.loads.delete(id));
      this.loads.set(id,pending);return pending;
    }
    setScene(phase){this.stopAll();this.phase=phase;this.rewardReady=false;this.changed();this.syncMusic();}
    setVoice(active){this.voice=active;if(active){this.stopEffects();this.stopMusic();}this.changed();if(!active)this.syncMusic();}
    setPaused(active){this.paused=active;if(active)this.stopAll();this.changed();if(!active)this.syncMusic();}
    setHidden(active){this.hidden=active;if(active)this.stopAll();this.changed();if(!active)this.syncMusic();}
    setEnabled(kind,enabled){if(kind==='music'){this.musicEnabled=!!enabled;if(!enabled)this.stopMusic(.12);}else if(kind==='effects'){this.effectsEnabled=!!enabled;if(!enabled)this.stopEffects();}if(enabled)for(const id of Object.keys(files))if(kind==='music'?id==='music':id!=='music')void this.load(id);this.changed();this.syncMusic();}
    allowRewardMusic(){this.rewardReady=true;this.syncMusic();}
    canPlay(){return this.unlocked&&this.context?.state==='running'&&!this.paused&&!this.hidden;}
    canMusic(){return this.canPlay()&&this.musicEnabled&&!this.voice&&(this.phase==='welcome'||this.phase==='reward'&&this.rewardReady);}
    async syncMusic(){
      if(!this.canMusic()){this.stopMusic(.06);return;}
      if(this.music)return;
      const token=this.generation,buffer=await this.load('music');
      if(!buffer||token!==this.generation||!this.canMusic()||this.music)return;
      try{const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;gain.gain.setValueAtTime(0,this.context.currentTime);gain.gain.linearRampToValueAtTime(.3,this.context.currentTime+.35);source.connect(gain);gain.connect(this.context.destination);const entry={source,gain};this.music=entry;source.onended=()=>{source.disconnect();gain.disconnect();if(this.music===entry){this.music=null;this.changed();}};source.start();this.changed();}catch(_){this.failed.add('music');this.changed();}
    }
    stopMusic(fade=0){const m=this.music;if(!m)return;this.music=null;try{m.gain.gain.cancelScheduledValues(this.context.currentTime);m.gain.gain.setValueAtTime(m.gain.gain.value,this.context.currentTime);m.gain.gain.linearRampToValueAtTime(0,this.context.currentTime+fade);m.source.stop(this.context.currentTime+fade);}catch(_){}this.changed();}
    effect(id){
      const buffer=this.buffers.get(id);
      if(!buffer||!this.canPlay()||!this.effectsEnabled||this.voice)return Promise.resolve(false);
      this.stopEffects();
      return new Promise(resolve=>{try{const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=.65;source.connect(gain);gain.connect(this.context.destination);const entry={source,finish:null};let done=false;entry.finish=()=>{if(done)return;done=true;this.effects.delete(entry);source.disconnect();gain.disconnect();resolve(true);this.changed();};source.onended=entry.finish;this.effects.add(entry);source.start();this.changed();}catch(_){resolve(false);}});
    }
    async lead(id){
      if(!this.buffers.has(id)||!this.canPlay()||!this.effectsEnabled||this.voice)return;
      const ended=this.effect(id);
      await Promise.race([ended,new Promise(resolve=>{const entry={timer:null,resolve};entry.timer=setTimeout(()=>{this.waits.delete(entry);resolve();},120);this.waits.add(entry);})]);
    }
    stopEffects(){for(const entry of [...this.effects]){try{entry.source.stop();}catch(_){}entry.finish();}for(const w of this.waits){clearTimeout(w.timer);w.resolve();}this.waits.clear();}
    stopAll(){this.generation++;this.stopEffects();this.stopMusic();}
  }
  return{Soundscape,files};
});
