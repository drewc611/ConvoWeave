import { createServer, request as httpRequest } from 'node:http';
import { createConvoWeaveHttpServer } from './server.mjs';
import { publicPage } from './publicPages.mjs';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT ?? '8790', 10);

const inner = createConvoWeaveHttpServer();
await new Promise((resolve) => inner.listen(0, '127.0.0.1', resolve));
const innerAddress = inner.address();
if (!innerAddress || typeof innerAddress === 'string') throw new Error('Unable to start MCP inner server.');

const outer = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (request.method === 'GET') {
    const html = publicPage(url.pathname);
    if (html) {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html),
        'Cache-Control': 'public, max-age=300',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(html);
      return;
    }
  }

  const proxy = httpRequest({
    host: '127.0.0.1',
    port: innerAddress.port,
    method: request.method,
    path: request.url,
    headers: request.headers,
  }, (upstream) => {
    response.writeHead(upstream.statusCode ?? 502, upstream.headers);
    upstream.pipe(response);
  });

  proxy.on('error', () => {
    if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'application/json' });
    if (!response.writableEnded) response.end(JSON.stringify({ error: 'upstream-unavailable' }));
  });
  request.pipe(proxy);
});

outer.listen(PORT, HOST, () => {
  console.info(`ConvoWeave public service listening on http://${HOST}:${PORT}`);
});

const shutdown = async () => {
  await new Promise((resolve) => outer.close(resolve));
  await inner.closeMcp();
  await new Promise((resolve) => inner.close(resolve));
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
