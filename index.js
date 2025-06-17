#!/usr/bin/env node

const http = require("http");
const httpProxy = require("http-proxy");
const { program } = require("commander");

program
  .argument("<jupyter-url>", "URL of the Jupyter server. For example, https://hub.dandiarchive.org/user/<username>")
  .requiredOption("-t, --token <token>", "JupyterHub API token")
  .option("-p, --port <port>", "Local proxy port. Default is 8010", "8010")
  .option(
    "-o, --allowed-origins <origins>",
    "Comma-separated list of allowed CORS origins. For example, https://nbfiddle.org"
  )
  .parse(process.argv);

const options = program.opts();
const jupyterUrl = program.args[0];
const token = options.token;
const port = parseInt(options.port, 10);
const allowedOrigins = options.allowedOrigins.split(",").map((o) => o.trim());

async function start() {
  const proxy = httpProxy.createProxyServer({
    target: `${jupyterUrl}`,
    changeOrigin: true,
    secure: false,
    ws: true
  });

  proxy.on("proxyReq", (proxyReq, req, res, options) => {
    // Set the Authorization header
    proxyReq.setHeader("Authorization", `Bearer ${token}`);
  });

  proxy.on("proxyReqWs", (proxyReq, req, socket, options, head) => {
    // Change the origin to the target URL
    const targetOrigin = new URL(jupyterUrl).origin;
    proxyReq.setHeader("Origin", targetOrigin);

    // Set the Authorization header
    proxyReq.setHeader("Authorization", `Bearer ${token}`);
  });

  // Handle errors
  proxy.on("error", (err, req, res) => {
    console.error("Proxy error:", err);
    res.writeHead(500, {
      "Content-Type": "text/plain",
    });
    res.end("An error occurred while proxying request.");
  });

  const server = http.createServer((req, res) => {
    proxy.web(req, res, { target: jupyterUrl });
  });

  // Handle WebSocket upgrade
  server.on("upgrade", (req, socket, head) => {
    proxy.ws(req, socket, head, { target: jupyterUrl });
  });

  // Add CORS headers to responses
  proxy.on("proxyRes", (proxyRes, req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      proxyRes.headers["Access-Control-Allow-Origin"] = origin;
      proxyRes.headers["Access-Control-Allow-Headers"] = "*";
      proxyRes.headers["Access-Control-Allow-Methods"] =
        "GET, POST, PUT, DELETE, OPTIONS";
      proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
    }
  });

  server.listen(port, () => {
    console.log(`jupyter-web-proxy running on http://localhost:${port}`);
    console.log(`Proxying to ${jupyterUrl}`);
  });
}

start();
