const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Soundscape,files}=require('../demo/soundscape.js');
class FakeSource{constructor(){this.buffer=null;this.started=false;this.stopped=false;}connect(){}disconnect(){}start(){this.started=true;}stop(){this.stopped=true;this.onended?.();}}
function setup(fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)})){
 const sources=[],context={state:'running',currentTime:0,destination:{},resume:async()=>{},decodeAudioData:async()=>({duration:.1}),createBufferSource(){const source=new FakeSource();sources.push(source);return source;},createGain(){return{gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}};}};
 const s=new Soundscape({url:file=>file,createContext:()=>context,fetcher});return{s,context,sources};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('до действия пользователя нет контекста, загрузки и звука',()=>{const{s}=setup();assert.equal(s.context,null);assert.equal(s.snapshot().musicEnabled,true);assert.equal(s.snapshot().effectsEnabled,true);assert.equal(s.snapshot().musicPlaying,false);assert.equal(Object.keys(files).length,8);});
test('музыка играет только на главном и после разрешения финала',async()=>{const{s,sources}=setup();s.unlock();await flush();assert.equal(s.snapshot().musicPlaying,true);s.setScene('letter');await flush();assert.equal(s.snapshot().musicPlaying,false);assert.ok(sources[0].stopped);for(const phase of['example','packing','speak','catch','parent']){s.setScene(phase);await flush();assert.equal(s.snapshot().musicPlaying,false);}s.setScene('reward');await flush();assert.equal(s.snapshot().musicPlaying,false);s.allowRewardMusic();await flush();assert.equal(s.snapshot().musicPlaying,true);});
test('голос прерывает эффект; быстрые нажатия не создают несколько эффектов',async()=>{const{s,sources}=setup();s.setScene('catch');s.unlock();await flush();const a=s.effect('catch');const first=sources.at(-1);const b=s.effect('catch');await a;assert.equal(first.stopped,true);assert.equal(s.effects.size,1);s.setVoice(true);await b;assert.equal(s.effects.size,0);await s.effect('tap');assert.equal(s.effects.size,0);});
test('поздняя загрузка музыки после ухода с экрана не запускает звук',async()=>{let release;const{s}=setup(()=>new Promise(resolve=>{release=resolve;}));s.unlock();s.setScene('packing');release({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await flush();assert.equal(s.snapshot().musicPlaying,false);});
test('отсутствующий файл и отказ контекста не ломают игру',async()=>{const{s}=setup(async()=>{throw Error('404');});s.unlock();await flush();assert.equal(s.snapshot().musicPlaying,false);assert.equal(s.failed.size,8);await s.lead('tap');const broken=new Soundscape({url:x=>x,createContext:()=>{throw Error('blocked');}});assert.doesNotThrow(()=>broken.unlock());assert.equal(broken.unlocked,false);});
test('пауза, скрытие и переход отменяют эффекты, настройки переживают смену сцены',async()=>{const{s}=setup();s.setScene('catch');s.unlock();await flush();const a=s.effect('catch');s.setHidden(true);await a;assert.equal(s.effects.size,0);s.setEnabled('effects',false);s.setEnabled('music',false);s.setScene('welcome');s.setHidden(false);await flush();assert.equal(s.musicEnabled,false);assert.equal(s.effectsEnabled,false);assert.equal(s.snapshot().musicPlaying,false);s.setEnabled('music',true);await flush();assert.equal(s.snapshot().musicPlaying,true);s.setPaused(true);assert.equal(s.snapshot().musicPlaying,false);s.setPaused(false);await flush();assert.equal(s.snapshot().musicPlaying,true);});


test('повторное включение восстанавливает файлы после временного сбоя',async()=>{
 let available=false;
 const{s}=setup(async()=>{if(!available)throw Error('temporary');return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};});
 s.unlock();await flush();assert.equal(s.failed.size,8);assert.equal(s.loads.size,0);
 available=true;s.setEnabled('music',false);s.setEnabled('music',true);s.setEnabled('effects',false);s.setEnabled('effects',true);await flush();
 assert.equal(s.failed.size,0);assert.equal(s.buffers.size,8);assert.equal(s.snapshot().musicPlaying,true);
});
test('закрытый аудиоконтекст пересоздаётся после нового жеста',async()=>{
 const{s,context}=setup();s.unlock();await flush();s.context.state='closed';
 const next={...context,state:'running'};s.createContext=()=>next;s.unlock();await flush();
 assert.equal(s.context,next);assert.equal(s.unlocked,true);assert.equal(s.snapshot().musicPlaying,true);
});
