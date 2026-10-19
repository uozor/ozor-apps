import { defineConfig } from 'wxt';
import { CONFIG, isPlaceholderBackend, isPlaceholderExtensionPay } from './src/config';
import catalog from '../tools.json';

const toolPages = (catalog as { tools: { id: string }[] }).tools.map((tool) => `site/${tool.id}/index.html`);

function extraHosts(): string[] {
  const hosts: string[] = [];
  if (CONFIG.paywallMode === 'live' && !isPlaceholderExtensionPay(CONFIG.extensionPayId)) {
    hosts.push('https://extensionpay.com/*');
  }
  if (!isPlaceholderBackend(CONFIG.backendUrl)) {
    try {
      hosts.push(`${new URL(CONFIG.backendUrl).origin}/*`);
    } catch { /* ignore a bad URL at build time; the README covers the fix */ }
  }
  return hosts;
}

export default defineConfig({
  srcDir: 'src',
  modules: [],
  manifestVersion: 3,
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (_wxt.config.browser !== 'safari') return;
      const extra = manifest as { permissions?: string[]; side_panel?: unknown };
      extra.permissions = (extra.permissions || []).filter((permission) => permission !== 'sidePanel');
      delete extra.side_panel;
    },
  },
  vite: () => ({
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'preact',
    },
    server: { fs: { allow: ['..'] } },
  }),
  manifest: ({ browser }) => {
    const sidePanel = browser === 'chrome' || browser === 'edge';
    const hosts = extraHosts();
    return {
      name: 'GWB Tools',
      short_name: 'GWB Tools',
      description: 'Free small-business tools in your browser. Optional Pro reads only the page you choose. Nothing is uploaded for free tools.',
      author: 'OZOR INC LLC',
      homepage_url: 'https://greaterworldmedia.tech/',
      icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
      action: {
        default_title: 'GWB Tools',
        default_popup: 'popup.html',
        default_icon: { 16: 'icons/16.png', 32: 'icons/32.png' },
      },
      permissions: [
        'storage',
        'activeTab',
        'scripting',
        'contextMenus',
        ...(sidePanel ? ['sidePanel'] : []),
      ],
      ...(hosts.length ? { host_permissions: hosts } : {}),
      sandbox: { pages: toolPages },
      content_security_policy: {
        extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
        sandbox: "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'self'",
      },
      ...(browser === 'firefox'
        ? {
            browser_specific_settings: {
              gecko: {
                id: 'gwb-tools@greaterworldmedia.tech',
                strict_min_version: '140.0',
                data_collection_permissions: {
                  required: ['none'],
                  optional: ['websiteContent'],
                },
              },
            },
            sidebar_action: {
              default_title: 'GWB Tools',
              default_panel: 'sidepanel.html',
              default_icon: { 32: 'icons/32.png' },
            },
          }
        : {}),
    };
  },
});
