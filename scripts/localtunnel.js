#!/usr/bin/env node
'use strict';

const localtunnel = require('localtunnel');
const { URL } = require('url');

const target = process.argv[2] ?? 'api';
const supported = new Set(['api', 'ws', 'both']);

if (!supported.has(target)) {
  console.error('Usage: node ./scripts/localtunnel.js [api|ws|both]');
  process.exit(1);
}

const globalHost = process.env.LOCALTUNNEL_HOST;
const localHost = process.env.LOCALTUNNEL_LOCAL_HOST || 'localhost';

const config = {
  api: {
    name: 'API',
    port: toPort(process.env.LOCALTUNNEL_API_PORT, 8000),
    subdomain: process.env.LOCALTUNNEL_API_SUBDOMAIN,
    onReady(url) {
      console.log(`[API] Public base URL: ${url}`);
      console.log(`[API] Suggested EXPO_PUBLIC_API_URL=${url}/api`);
    },
  },
  ws: {
    name: 'WebSocket',
    port: toPort(process.env.LOCALTUNNEL_WS_PORT, 6001),
    subdomain: process.env.LOCALTUNNEL_WS_SUBDOMAIN,
    onReady(url) {
      const wsUrl = url.replace(/^http/, 'ws');
      const { host } = new URL(url);
      console.log(`[WS] Public WebSocket URL: ${wsUrl}`);
      console.log('[WS] Suggested .env updates:');
      console.log(`      EXPO_PUBLIC_REVERB_SCHEME=wss`);
      console.log(`      EXPO_PUBLIC_REVERB_HOST=${host}`);
      console.log('      EXPO_PUBLIC_REVERB_PORT=443');
    },
  },
};

function toPort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

async function startTunnel(key, onFatal) {
  const { name, port, subdomain, onReady } = config[key];
  const options = {
    port,
    local_host: localHost,
  };

  if (subdomain) {
    options.subdomain = subdomain;
  }

  if (globalHost) {
    options.host = globalHost;
  }

  try {
    const tunnel = await localtunnel(options);
    console.log(`[${name}] Tunnel established on port ${port}`);
    console.log(`[${name}] Public URL: ${tunnel.url}`);
    onReady(tunnel.url);
    tunnel.on('close', () => {
      console.log(`[${name}] Tunnel closed`);
    });
    tunnel.on('error', (error) => {
      console.error(`[${name}] Tunnel error: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.error(`[${name}] LocalTunnel server refused the connection. This is usually temporary or caused by network/firewall restrictions.`);
      }
      if (typeof onFatal === 'function') {
        onFatal(error);
      }
    });
    return tunnel;
  } catch (error) {
    console.error(`[${name}] Failed to start tunnel:`, error.message);
    throw error;
  }
}

(async () => {
  const keys = target === 'both' ? ['api', 'ws'] : [target];
  const tunnels = [];
  let shuttingDown = false;

  function closeAll(code = 0) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log('\nClosing tunnels...');
    for (const tunnel of tunnels) {
      tunnel.close();
    }
    process.exit(code);
  }

  try {
    for (const key of keys) {
      const tunnel = await startTunnel(key, () => closeAll(1));
      tunnels.push(tunnel);
    }

    if (!tunnels.length) {
      console.error('No tunnels were started.');
      process.exit(1);
    }

    console.log('Tunnels are running. Press Ctrl+C to close.');

    process.on('SIGINT', () => closeAll(0));
    process.on('SIGTERM', () => closeAll(0));
  } catch (error) {
    closeAll(1);
  }
})();
