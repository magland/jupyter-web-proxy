# jupyter-web-proxy

A proxy tool designed for web applications like nbfiddle and dandiset-explorer to connect to JupyterHub resources (such as dandihub). It securely manages HTTP and WebSocket connections between web applications and Jupyter servers.

## Installation

```bash
npm install -g jupyter-web-proxy
```

## Usage

```bash
jupyter-web-proxy <jupyter-url> -t <token> [options]
```

### Required Arguments

- `jupyter-url`: URL of the Jupyter server (e.g., https://hub.dandiarchive.org/user/username)
- `-t, --token`: JupyterHub API token

### Optional Arguments

- `-p, --port`: Local proxy port (default: 8010)
- `-o, --allowed-origins`: Comma-separated list of allowed CORS origins (e.g., https://nbfiddle.org)

### Examples

```bash
# Basic usage with nbfiddle.org
jupyter-web-proxy https://hub.dandiarchive.org/user/myname -t abc123 -p 8010 -o https://nbfiddle.org

# Usage with multiple allowed origins
jupyter-web-proxy https://hub.dandiarchive.org/user/<user> -t <token> -o https://nbfiddle.app,https://dandi-ai-notebooks.github.io
```

### Getting a JupyterHub API Token

To obtain an API token from JupyterHub:
1. Log in to your JupyterHub instance (e.g., https://hub.dandiarchive.org)
2. Click on "File" > "Hub Control Panel"
3. Go to the "Token" or "API Tokens" section
4. Click "Generate Token" and copy the generated token

### Web Application Configuration

By default, the proxy runs on port 8010. You can change this using the `-p` option. In your web application (e.g., nbfiddle.app), configure it to connect to:

```
http://localhost:8010
```

## Technical Details

The proxy:
- Forwards HTTP and WebSocket requests to the specified Jupyter server
- Adds authentication headers to all requests
- Manages CORS headers for web application access
- Handles connection upgrades for WebSocket support
- Provides error reporting for failed connections

## License

Apache License 2.0
