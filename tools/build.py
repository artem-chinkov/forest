"""Create a portable, dependency-free static copy; no upload or Git actions."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
output = root/'dist'
if output.exists():
    shutil.rmtree(output)
output.mkdir(exist_ok=True)
shutil.copy2(root/'index.html', output/'index.html')
shutil.copytree(root/'demo', output/'demo', dirs_exist_ok=True)
packs = ['characters/hedgehog-v1','objects/raster-v1','backgrounds/raster-v1','props/raster-v1','audio/demo-v2']
for pack in packs:
    shutil.copytree(root/'public/assets'/pack, output/'public/assets'/pack, dirs_exist_ok=True)
print(f'Локальная сборка: {output}. Публикация не выполнялась.')
