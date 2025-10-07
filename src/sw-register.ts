export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const url = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(url).catch(console.error);
    });
  }
}
