// Service Worker for PromptMiner AI
const CACHE_NAME = 'prompt-miner-v1';
const DB_NAME = 'PromptMinerShareDB';
const DB_STORE = 'shared-content';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Helper to open IDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept the Share Target POST request
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('file');
        const text = formData.get('text');
        const urlParam = formData.get('url');
        const title = formData.get('title');

        // Consolidate text/url into one string if both exist
        let sharedText = text || '';
        if (urlParam) {
            sharedText = sharedText ? `${sharedText}\n${urlParam}` : urlParam;
        }

        // Store in IndexedDB
        const db = await openDB();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(DB_STORE, 'readwrite');
          const store = tx.objectStore(DB_STORE);
          const item = {
            id: 'latest-share',
            timestamp: Date.now(),
            text: sharedText,
            title: title,
            file: file // File object
          };
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        // Redirect to the app with a flag
        return Response.redirect('/?shared=true', 303);
      } catch (err) {
        console.error('Share Target Error:', err);
        return Response.redirect('/?error=share_failed', 303);
      }
    })());
  }
});