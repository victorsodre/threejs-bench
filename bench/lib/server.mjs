import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Minimal static file server rooted at `root`. Directory requests resolve to
// index.html, mirroring how the scenes are published on GitHub Pages.
export const startServer = (root) =>
  new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        // Browsers auto-request /favicon.ico; answer 204 so it doesn't show up
        // as a spurious 404 console error and skew the correctness check.
        if (urlPath.endsWith('/favicon.ico')) {
          res.writeHead(204);
          res.end();
          return;
        }
        let rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
        let filePath = join(root, rel);
        const info = await stat(filePath).catch(() => null);
        if (info && info.isDirectory()) filePath = join(filePath, 'index.html');
        const body = await readFile(filePath);
        res.writeHead(200, { 'content-type': TYPES[extname(filePath)] || 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, url: `http://127.0.0.1:${port}` });
    });
  });
