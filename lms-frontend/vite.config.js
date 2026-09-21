import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss()],

    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      },
    },

    server: {
      port: 3000,
      strictPort: true,
      // Supports tenant.localhost workspaces without accepting arbitrary hosts.
      allowedHosts: ['.localhost'],
      proxy: env.VITE_DEV_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_DEV_PROXY_TARGET,
              changeOrigin: true,
              secure: false,
              // This scoped local setting also covers the initial login
              // before browser storage is available to the client.
              headers: env.VITE_DEV_TENANT_SLUG
                ? { 'X-Tenant-Slug': env.VITE_DEV_TENANT_SLUG }
                : undefined,
              // The proxy is the local equivalent of production host-based
              // tenant resolution. It makes the first login request tenant-aware
              // before browser storage has been populated.
              configure(proxy) {
                proxy.on('proxyReq', (proxyRequest, request) => {
                  const host = String(request.headers.host ?? '').split(':')[0].toLowerCase();
                  const suffix = '.localhost';
                  if (!host.endsWith(suffix)) return;
                  const slug = host.slice(0, -suffix.length);
                  if (!env.VITE_DEV_TENANT_SLUG && slug && !slug.includes('.') && slug !== 'platform') {
                    proxyRequest.setHeader('X-Tenant-Slug', slug);
                  }
                });
              },
            },
          }
        : undefined,
    },

    preview: { port: 3000 },

    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production' ? true : 'hidden',
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Rolldown (Vite 8) requires the function form.
          manualChunks(id) {
            // Vite normalises module ids to POSIX separators on every platform.
            if (!id.includes('/node_modules/')) return undefined;
            const pkg = id.split('/node_modules/').pop().split('/')[0];
            if (
              ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(pkg)
            ) {
              return 'react';
            }
            if (['@reduxjs', 'react-redux', 'redux', '@tanstack'].includes(pkg)) return 'state';
            if (['react-hook-form', 'zod', '@hookform'].includes(pkg)) return 'forms';
            return 'vendor';
          },
        },
      },
    },

    test: {
      environment: 'jsdom',
      // The forks pool is flaky in sandboxed CI containers; threads is also
      // faster for jsdom suites.
      pool: 'threads',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      include: ['tests/unit/**/*.test.{js,jsx}', 'tests/integration/**/*.test.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/types/**'],
        // Ratchet floor: CI fails if coverage DROPS. Raise these numbers as
        // tests land - the target for a production release is 60%+.
        thresholds: { lines: 8, functions: 4, branches: 10, statements: 8 },
      },
    },
  };
});
