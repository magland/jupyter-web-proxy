#!/usr/bin/env node

const http = require("http");
const https = require("https");
const httpProxy = require("http-proxy");
const { program } = require("commander");

program
  .argument("<jupyter-url>", "URL of the Jupyter server. For example, https://hub.dandiarchive.org/user/<username>")
  .requiredOption("-t, --token <token>", "JupyterHub API token")
  .option("-p, --port <port>", "Local proxy port. Default is 8010", "8010")
  .option(
    "-o, --allowed-origins <origins>",
    "Comma-separated list of allowed CORS origins. For example, https://nbfiddle.app"
  )
  .parse(process.argv);

const options = program.opts();
const jupyterUrl = program.args[0];
const token = options.token;
const port = parseInt(options.port, 10);
const allowedOrigins = options.allowedOrigins.split(",").map((o) => o.trim());

async function start() {
  await checkServerRunning();

  const proxy = httpProxy.createProxyServer({
    target: `${jupyterUrl}`,
    changeOrigin: true,
    secure: true,
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
    else {
      // do not allow CORS for this origin
      proxyRes.headers["Access-Control-Allow-Origin"] = "null";
    }
  });

  server.listen(port, () => {
    console.log(`Proxying to ${jupyterUrl} at http://localhost:${port}`);
  });
}

async function checkServerRunning() {
  // jupyterUrl is for example https://hhmi.2i2c.cloud/user/magland
  // we want to get user name and base URL
  const url = new URL(jupyterUrl);
  const username = url.pathname.split("/")[2];
  const baseUrl = `${url.protocol}//${url.host}`;
  const a = `${baseUrl}/hub/api/users/${username}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const resp = await getJson(a, headers);
  if (!resp || !resp.servers) {
    throw new Error(`Unable to get server information for user ${username} at ${baseUrl}`);
  }
  const servers = resp.servers;
  if (Object.keys(servers).length === 0) {
    throw new Error(`No active servers found for user ${username} at ${baseUrl}`);
  }
  const firstServer = servers[Object.keys(servers)[0]];
  const started = firstServer.started;
  const last_activity = firstServer.last_activity;
  if (!started) {
    console.info(`Server for user ${username} at ${baseUrl} is not started yet.`);
    console.info(jupyterUrl);
    return;
  }
  if (last_activity) {
    console.log(`Last activity for server: ${last_activity}`);
  }
  console.log(`Server for user ${username} at ${baseUrl} is running.`);
  console.log(jupyterUrl);
}

async function getJson(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

start();
