import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startServer } from '../lib/server.mjs';

test('servidor mantém cenas acessíveis e protege arquivos locais', async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), 'bench-server-'));
  const root = join(fixture, 'public');
  await mkdir(join(root, '.git'), { recursive: true });
  await mkdir(join(root, 'scene'));
  await writeFile(join(root, 'scene', 'index.html'), '<p>Cena</p>');
  await writeFile(join(root, '.env'), 'PRIVATE_FIXTURE');
  await writeFile(join(root, '.git', 'HEAD'), 'PRIVATE_FIXTURE');
  await writeFile(join(fixture, 'outside.txt'), 'PRIVATE_FIXTURE');
  await symlink(join(fixture, 'outside.txt'), join(root, 'escape.txt'));
  await symlink(join(root, '.env'), join(root, 'alias.txt'));
  const { server, port } = await startServer(root);
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(fixture, { recursive: true, force: true });
  });
  const request = (path, options = {}) => new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, ...options }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.setTimeout(2000, () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end();
  });
  for (const path of ['/.env', '/%2egit/HEAD', '/escape.txt', '/alias.txt', '/../outside.txt']) {
    await t.test(`bloqueia ${path}`, async () => {
      const result = await request(path);
      assert.equal(result.status, 404);
      assert.ok(!result.body.includes('PRIVATE_FIXTURE'));
    });
  }
  await t.test('recusa Host e Origin externos', async () => {
    assert.equal((await request('/scene/', { headers: { Host: 'attacker.invalid' } })).status, 403);
    assert.equal((await request('/scene/', { headers: { Origin: 'https://attacker.invalid' } })).status, 403);
  });
  await t.test('trata URL inválida e métodos sem derrubar o servidor', async () => {
    assert.equal((await request('/%ZZ')).status, 400);
    assert.equal((await request('/scene/', { method: 'POST' })).status, 405);
    const result = await request('/scene/');
    assert.equal(result.status, 200);
    assert.equal(result.body, '<p>Cena</p>');
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
    const head = await request('/scene/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.equal((await request('/favicon.ico')).status, 204);
  });
});
