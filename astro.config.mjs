// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

const isCloudflare = process.env.CLOUDFLARE === 'true' || process.env.CF_PAGES === '1';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isCloudflare
    ? cloudflare()
    : node({
        mode: 'standalone',
      }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
  },
  server: {
    port: 3000,
    host: true,
  }
});
