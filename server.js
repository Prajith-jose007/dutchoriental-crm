
// server.js
console.log('Attempting to start DutchOriental CRM server.js...'); // Added for debugging

const { createServer } = require('node:http');
// const { parse } = require('node:url'); // Removed deprecated import
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
// For cPanel, the hostname is often managed by the proxy/environment.
// Next.js might need 0.0.0.0 to bind correctly if not proxied via localhost.
// However, starting with 'localhost' is standard, and cPanel's port mapping usually handles the external access.
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3001; // cPanel usually injects PORT

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Use WHATWG URL API instead of deprecated url.parse
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const parsedUrl = {
        pathname: url.pathname,
        query: Object.fromEntries(url.searchParams),
      };
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
      console.log(`> DutchOriental CRM server ready on http://${hostname}:${port}`); // Modified log
      console.log(`> NODE_ENV: ${process.env.NODE_ENV}`); // Added to check env
    });
});
