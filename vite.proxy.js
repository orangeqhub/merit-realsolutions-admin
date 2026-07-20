/**
 * Shared Vite dev-server proxy for API requests.
 * Returns JSON 503 when backend is down instead of noisy ECONNREFUSED stack traces.
 */
export function createApiProxy(apiTarget = 'http://localhost:3002') {
  let lastProxyWarnAt = 0;

  return {
    target: apiTarget,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('error', (err, _req, res) => {
        const now = Date.now();
        if (now - lastProxyWarnAt > 30000) {
          lastProxyWarnAt = now;
          console.warn('\n[vite] API backend is not reachable at', apiTarget);
          console.warn('[vite] Start it first: cd meritrealsolutions-backend && npm run dev\n');
        }

        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            status: 'offline',
            message: 'Backend API is not running. Start meritrealsolutions-backend on port 3002.',
          }));
        }
      });
    },
  };
}

export function createDevServerConfig(apiTarget) {
  const proxy = createApiProxy(apiTarget);
  return {
    proxy: {
      '/api': proxy,
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  };
}
