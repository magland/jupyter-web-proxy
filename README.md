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

### Example

```bash
jupyter-web-proxy https://hub.dandiarchive.org/user/myname -t abc123 -p 8010 -o https://nbfiddle.org
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
