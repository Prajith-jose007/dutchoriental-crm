// server.js
const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
// For cPanel, the hostname is often managed by the proxy/environment.
// Next.js might need 0.0.0.0 to bind correctly if not proxied via localhost.
// However, starting with 'localhost' is standard, and cPanel's port mapping usually handles the external access.
const hostname = 'localhost'; 
const port = parseInt(process.env.PORT, 10) || 3000; // cPanel usually injects PORT

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
