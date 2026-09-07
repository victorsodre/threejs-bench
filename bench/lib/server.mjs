import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { join, relative, isAbsolute, extname } from 'node:path';

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
export const startServer = async (root) => {
  const canonicalRoot = await realpath(root);
  const isPublicPath = (path) => {
    const rel = relative(canonicalRoot, path);
    return !isAbsolute(rel) && !rel.split(/[/\\]/).some(part => part.startsWith('.'));
  };
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const reply = (status, body) => {
        res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(req.method === 'HEAD' ? undefined : body);
      };
      const port = server.address().port;
      const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
      const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
      if (!hosts.has(req.headers.host) || (req.headers.origin && !origins.has(req.headers.origin))) {
        reply(403, 'Acesso permitido apenas pela página local');
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        reply(405, 'Método não permitido');
        return;
      }
      let urlPath;
      try {
        urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      } catch {
        reply(400, 'URL inválida');
        return;
      }
      if (!urlPath.startsWith('/') || urlPath.includes('\\') || urlPath.includes('\0') || urlPath.split('/').some(part => part.startsWith('.'))) {
        reply(404, 'Não encontrado');
        return;
      }
      try {
        // Browsers auto-request /favicon.ico; answer 204 so it doesn't show up
        // as a spurious 404 console error and skew the correctness check.
        if (urlPath.endsWith('/favicon.ico')) {
          res.writeHead(204);
          res.end();
          return;
        }
        let filePath = await realpath(join(canonicalRoot, urlPath));
        if (!isPublicPath(filePath)) {
          reply(404, 'Não encontrado');
          return;
        }
        const info = await stat(filePath).catch(() => null);
        if (info && info.isDirectory()) filePath = await realpath(join(filePath, 'index.html'));
        if (!isPublicPath(filePath)) {
          reply(404, 'Não encontrado');
          return;
        }
        const body = await readFile(filePath);
        res.writeHead(200, { 'content-type': TYPES[extname(filePath)] || 'application/octet-stream' });
        res.end(req.method === 'HEAD' ? undefined : body);
      } catch {
        reply(404, 'Não encontrado');
      }
    });
    server.on('error', reject);
    server.requestTimeout = 10000;
    server.headersTimeout = 10000;
    server.maxConnections = 16;
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, url: `http://127.0.0.1:${port}` });
    });
  });
};
