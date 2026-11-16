from pathlib import Path
import hashlib,json,wave
root=Path(__file__).resolve().parent.parent
folder=root/'public/assets/audio/demo-v2'
manifest=json.loads((folder/'manifest.json').read_text())
assert manifest['voice']=='ru-RU-DmitryNeural' and manifest['selectedByUser']
for key,clip in manifest['clips'].items():
 path=folder/clip['file'];assert path.is_file(),key
 assert hashlib.sha256(path.read_bytes()).hexdigest()==clip['sha256'],key
 with wave.open(str(path)) as sound:
  assert sound.getnchannels()==1 and sound.getframerate()==22050 and sound.getsampwidth()==2,key
  assert abs(sound.getnframes()/sound.getframerate()-clip['duration'])<.002,key
source=json.loads((root/'content/audio-scripts.json').read_text())
assert source['clips']['letter-m']=='М'
for key in ['packing-intro','packing-retry']:
 assert 'мыло' not in source['clips'][key].lower() and 'молоко' not in source['clips'][key].lower(),key
for key in source['clips']:assert key in manifest['clips'],key
for key in source['letterExamples']:assert 'letter-'+key in manifest['clips'],key
words={'soap','cat','house','onion','sea','nose','mother','car','umbrella','watermelon','milk','juice','fish','bridge','pear','forest','fly','tree','book','hammer','moon','boot','carrot','owl','cake','mask','bucket','balloon'}
for word in words:
 assert (root/f'public/assets/objects/raster-v1/{word}.webp').is_file(),word
 assert 'word-'+word in manifest['clips'],word
for pose in ['greeting','pointing','parcel','listening','celebration','idle','happy']:
 assert (root/f'public/assets/characters/hedgehog-v1/hedgehog_{pose}.webp').is_file(),pose
for scene in ['forest-post-office','postal-counter']:
 for orientation in ['wide','portrait']:assert (root/f'public/assets/backgrounds/raster-v1/{scene}-{orientation}.webp').is_file()
for prop in ['parcel','envelope','mailbox','reward-stamp']:assert (root/f'public/assets/props/raster-v1/{prop}.webp').is_file()
print(f'Проверены 28 картинок, реквизит и {len(manifest["clips"])} WAV: формат, длительность, контрольные суммы.')

# Decorative sound files are independent from the approved voice pack.
sound_folder=root/'public/assets/audio/soundscape-v1'
sound_manifest=json.loads((sound_folder/'manifest.json').read_text())
assert set(sound_manifest['clips'])=={'tap','pack','return','send','catch','envelope','reward','music'}
assert sound_manifest['license']=='CC0-1.0'
for key,clip in sound_manifest['clips'].items():
 path=sound_folder/clip['file']
 assert path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==clip['sha256'],key
 assert clip['author'] and clip['sourceUrl'].startswith('https://') and clip['license']=='CC0-1.0',key
 assert len(clip['sourceSha256'])==64,key
 if key!='music':
  with wave.open(str(path)) as sound:
   assert sound.getnchannels()==1 and sound.getframerate()==22050 and sound.getsampwidth()==2,key
   assert abs(sound.getnframes()/sound.getframerate()-clip['duration'])<.002,key
 else:
  assert clip['file'].endswith('.mp3') and 0<=clip['loopStart']<clip['loopEnd']<=clip['duration'],key
print('Проверены музыка, 7 эффектов, лицензии и контрольные суммы.')
