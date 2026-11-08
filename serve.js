const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3005;
const BUILD_DIR = path.join(__dirname, 'build');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json'
};

const memoryCache = new Map();

function getFile(filePath) {
  if (memoryCache.has(filePath)) {
    return memoryCache.get(filePath);
  }
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath);
  // Cache assets in memory (exclude index.html from cache during development updates)
  if (!filePath.endsWith('index.html')) {
    memoryCache.set(filePath, data);
  }
  return data;
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !reqPath) {
    reqPath = '/index.html';
  }
  let filePath = path.join(BUILD_DIR, reqPath);

  let data = getFile(filePath);
  if (!data) {
    filePath = path.join(BUILD_DIR, 'index.html');
    data = getFile(filePath);
  }

  if (!data) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const headers = {
    'Content-Type': contentType,
    'Content-Length': data.length
  };

  if (reqPath.startsWith('/static/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'no-cache';
  }

  res.writeHead(200, headers);
  res.end(data);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`High-speed static server running at http://localhost:${PORT}`);
});
