import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execSync} from 'child_process';
import path from 'path';
import {defineConfig} from 'vite';

// "2026-11-03 · 27baacd": shown in the footer so you can tell which build a device is running
function buildVersion(): string {
  let commit = process.env.GITHUB_SHA?.slice(0, 7);
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      commit = 'dev';
    }
  }
  return `${new Date().toISOString().slice(0, 10)} · ${commit}`;
}

export default defineConfig(() => {
  return {
    // Base path for GitHub Pages (served from https://<user>.github.io/bandoviet/).
    // Override with BASE_PATH env var (e.g. '/' for a custom domain or user/org page).
    base: process.env.BASE_PATH ?? '/bandoviet/',
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be disabled via the DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
