"""Local read-only preview. No child data or application backend."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse, threading, webbrowser

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--open', action='store_true')
parser.add_argument('--directory', type=Path, default=root)
args = parser.parse_args()
handler = partial(SimpleHTTPRequestHandler, directory=str(args.directory))
try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError as error:
    raise SystemExit(f'Не удалось открыть порт {args.port}: {error}. Попробуйте --port 8766.')
url = f'http://127.0.0.1:{args.port}/demo/'
print(f'Лесная почта: {url}', flush=True)
print('Оставьте это окно открытым. Для остановки нажмите Control+C.', flush=True)
if args.open:
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
