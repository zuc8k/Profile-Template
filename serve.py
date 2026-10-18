#!/usr/bin/env python3
"""Static server for the Zucks site with SPA rewrites.

The site uses clean URLs ( /what-i-do, /vetox ... ) via history.pushState,
so any path that isn't a real file is served index.html instead of a 404.

Usage:  python serve.py [port]     (default port 8765)
"""
import http.server
import socketserver
import sys
import urllib.parse
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
SOURCE_ROOT = Path(__file__).resolve().parent
DIST_ROOT = SOURCE_ROOT / 'dist'
ROOT = DIST_ROOT if DIST_ROOT.is_dir() else SOURCE_ROOT


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path != '/' and not (ROOT / path.lstrip('/')).exists():
            self.path = '/index.html'
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('%s - %s\n' % (self.address_string(), fmt % args))


if __name__ == '__main__':
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f'Zucks site running at http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
