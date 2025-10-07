// src/sw-register.ts
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Works at root or at /chord-drone/
      const path = window.location.pathname;
      const base = path.endsWith('/') ? path : path.replace(/[^/]*$/, '');
      const url = base + 'sw.js';
      navigator.serviceWorker.register(url).catch(console.error);
    });
  }
}
