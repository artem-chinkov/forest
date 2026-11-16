(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./catalog.js'):root.ForestCatalog);if(typeof module==='object'&&module.exports)module.exports=api;else root.ForestLesson=api;})(typeof globalThis!=='undefined'?globalThis:this,function(catalog){
  'use strict';
  const phases=Object.freeze(['welcome','letter','example','packing','speak','catch','reward','parent']);
  const packTargets=Object.freeze(['soap','milk']);
  const speechHints=Object.freeze(['car','fly','mask','carrot']);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function shuffled(values,seed){const result=[...values];let value=seed>>>0;for(let i=result.length-1;i>0;i--){value=(Math.imul(value,1664525)+1013904223)>>>0;const j=value%(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
  function deck(seed){const targets=shuffled(Object.keys(catalog).filter(id=>catalog[id].target),seed^0x461a).slice(0,5);const others=shuffled(Object.keys(catalog).filter(id=>!catalog[id].target),seed^0xa871).slice(0,4);return targets.flatMap((id,i)=>i<4?[id,others[i]]:[id]);}
  function createSession(seed=Date.now()){return{version:2,seed:seed>>>0,phase:'welcome',letterDone:false,exampleDone:false,
    packing:{order:shuffled(['house','cat','milk','soap'],seed),packed:[],attempts:0,wrongDrops:0,hintCount:0,sent:false},
    speech:{offered:false,advanced:false,hintCount:0},
    catch:{queue:deck(seed),pending:null,collected:[],heard:[],missed:0,introduced:false,lettersSent:false}};}
  function pack(session,id){const s=clone(session);if(s.phase!=='packing'||s.packing.sent||!s.packing.order.includes(id)||s.packing.packed.includes(id)||s.packing.packed.length===2)return{session:s,effect:'ignored'};
    s.packing.attempts++;
    if(!packTargets.includes(id)){s.packing.wrongDrops++;if(s.packing.wrongDrops===2){s.packing.hintCount++;return{session:s,effect:'hint'};}return{session:s,effect:'retry'};}
    s.packing.packed.push(id);return{session:s,effect:s.packing.packed.length===2?'send-parcel':'packed'};
  }
  function sendParcel(session){const s=clone(session);if(s.phase==='packing'&&packTargets.every(id=>s.packing.packed.includes(id)))s.packing.sent=true;return s;}
  function hint(session){const s=clone(session);if(s.phase==='packing'&&!s.packing.sent)s.packing.hintCount++;if(s.phase==='speak')s.speech.hintCount++;return s;}
  function activeIds(session,capacity=3){if(session.catch.collected.length>=5||session.catch.lettersSent)return[];const queue=session.catch.queue;const visible=queue.slice(0,Math.max(2,Math.min(3,capacity)));
    const target=queue.find(id=>catalog[id].target);if(target&&!visible.some(id=>catalog[id].target))visible[visible.length-1]=target;
    const other=queue.find(id=>!catalog[id].target);if(other&&!visible.some(id=>!catalog[id].target)&&visible.length>1)visible[visible.length-1]=other;
    return visible;
  }
  function active(session){return activeIds(session)[0]||null;}
  function beginCatch(session,id,capacity=3){const s=clone(session);if(s.phase==='catch'&&!s.catch.pending&&activeIds(s,capacity).includes(id)&&!s.catch.collected.includes(id))s.catch.pending=id;return s;}
  function finishCatch(session,id){const s=clone(session);if(s.phase!=='catch'||s.catch.pending!==id||!s.catch.queue.includes(id))return s;
    s.catch.pending=null;s.catch.queue.splice(s.catch.queue.indexOf(id),1);s.catch.heard.push(id);
    if(catalog[id].target&&!s.catch.collected.includes(id))s.catch.collected.push(id);
    return s;
  }
  function miss(session,id,capacity=3){const s=clone(session);if(s.phase==='catch'&&!s.catch.pending&&activeIds(s,capacity).includes(id)){s.catch.queue.splice(s.catch.queue.indexOf(id),1);s.catch.queue.push(id);s.catch.missed++;}return s;}
  function sendLetters(session){const s=clone(session);if(s.phase==='catch'&&s.catch.collected.length===5&&!s.catch.pending)s.catch.lettersSent=true;return s;}
  function instructionDone(session){const s=clone(session);if(s.phase==='letter')s.letterDone=true;if(s.phase==='example')s.exampleDone=true;if(s.phase==='speak')s.speech.offered=true;if(s.phase==='catch')s.catch.introduced=true;return s;}
  function advance(session){const s=clone(session);const allowed=s.phase==='welcome'||(s.phase==='letter'&&s.letterDone)||(s.phase==='example'&&s.exampleDone)||(s.phase==='packing'&&s.packing.sent)||(s.phase==='speak'&&s.speech.offered)||(s.phase==='catch'&&s.catch.lettersSent);
    if(!allowed)return s;if(s.phase==='speak')s.speech.advanced=true;s.phase=phases[phases.indexOf(s.phase)+1];return s;
  }
  function report(s){return{parcelsSent:s.packing.sent?1:0,packed:[...s.packing.packed],packingAttempts:s.packing.attempts,packingWrongDrops:s.packing.wrongDrops,packingHints:s.packing.hintCount,speechHints:s.speech.hintCount,speechOffered:s.speech.offered,speechAdvanced:s.speech.advanced,speechVerified:false,lettersCollected:s.catch.collected.length,lettersSent:s.catch.lettersSent?5:0,caughtWords:s.catch.heard.map(id=>catalog[id].word),targetWords:s.catch.collected.map(id=>catalog[id].word)};}
  return{catalog,phases,packTargets,speechHints,shuffled,deck,createSession,pack,sendParcel,hint,active,activeIds,beginCatch,finishCatch,miss,sendLetters,instructionDone,advance,report};
});
