#!/usr/bin/env node
// Local static server that behaves like GitHub Pages: files, directory index.html, otherwise 404.html.
// Usage: npm run dev:static  (http://localhost:5500; add ?api=http://localhost:8787 to point at a local API)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5500);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

async function resolveFile(urlPath) {
  const filePath = normalize(join(root, decodeURIComponent(urlPath)));
  if (!filePath.startsWith(root)) return null;
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) return resolveFile(join(urlPath, 'index.html'));
    return filePath;
  } catch (_error) {
    return null;
  }
}

createServer(async (req, res) => {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  const filePath = await resolveFile(urlPath);
  const target = filePath || join(root, '404.html');
  try {
    const body = await readFile(target);
    res.writeHead(filePath ? 200 : 404, { 'Content-Type': types[extname(target)] || 'application/octet-stream' });
    res.end(body);
  } catch (_error) {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`Static site on http://localhost:${port}`));
