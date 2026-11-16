"""Pre-generate the selected voice; no synthesis is used by the browser."""
from pathlib import Path
import asyncio,hashlib,json,subprocess
import numpy as np
import soundfile as sf
import edge_tts
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'.cache/audio'
SOURCE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/assets/audio/demo-v2'
OUT.mkdir(parents=True,exist_ok=True)
SCRIPTS=json.loads((ROOT/'content/audio-scripts.json').read_text())
CACHE_PATH=SOURCE/'render-cache.json'
CACHE=json.loads(CACHE_PATH.read_text()) if CACHE_PATH.is_file() else {}
async def generate(key,text,semaphore):
 async with semaphore:
  source=SOURCE/(key+'.mp3');wav=OUT/(key+'.wav')
  signature=hashlib.sha256(json.dumps([SCRIPTS['voice'],SCRIPTS['rate'],SCRIPTS['pitch'],text],ensure_ascii=False).encode()).hexdigest()
  if not source.is_file() or source.stat().st_size<100 or CACHE.get(key)!=signature:
   for attempt in range(3):
    try:
     await edge_tts.Communicate(text,SCRIPTS['voice'],rate=SCRIPTS['rate'],pitch=SCRIPTS['pitch']).save(str(source))
     CACHE[key]=signature;CACHE_PATH.write_text(json.dumps(CACHE,indent=2)+'\n');break
    except Exception:
     if attempt==2:raise
     await asyncio.sleep(1+attempt)
  subprocess.run(['/usr/bin/afconvert',str(source),str(wav),'-f','WAVE','-d','LEI16@22050','-c','1'],check=True)
async def main():
 semaphore=asyncio.Semaphore(2)
 await asyncio.gather(*(generate(key,text,semaphore) for key,text in SCRIPTS['clips'].items()))
asyncio.run(main())
clips={}
for key,text in SCRIPTS['clips'].items():
 path=OUT/(key+'.wav');audio,rate=sf.read(str(path),dtype='float32')
 assert len(audio)>1000 and np.max(np.abs(audio))>.005,key
 clips[key]={'file':path.name,'text':text,'duration':round(len(audio)/rate,4),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'kind':'letter-name' if key.startswith('letter-') and key!='letter-name' else 'word' if key.startswith('word-') else 'instruction'}
(OUT/'manifest.json').write_text(json.dumps({'version':2,'voice':SCRIPTS['voice'],'engine':'edge-tts','rate':SCRIPTS['rate'],'selectedByUser':True,'synthetic':True,'methodistApproved':False,'cueStrategy':SCRIPTS['cueStrategy'],'clips':clips},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'clips':len(clips),'seconds':round(sum(c['duration'] for c in clips.values()),1)}))
