const CACHE_NAME = 'neon-blocks-auto-update';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  // สั่งให้ Service Worker ข้ามขั้นตอนรอไปทำงานทันที
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  // สั่งให้ Service Worker เริ่มควบคุมหน้าเว็บทันที
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // 1. พยายามดึงข้อมูลจาก Network ก่อนเสมอ (เพื่อให้ได้ของใหม่ล่าสุด)
    fetch(event.request)
      .then(networkResponse => {
        // ถ้าดึงข้อมูลจาก Network สำเร็จ ให้เอามาเก็บลง Cache ไว้เผื่อตอนออฟไลน์
        // สำคัญ: เราต้องโคลน Response ก่อน เพราะ Stream ถูกอ่านได้ครั้งเดียว
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // 2. ถ้าดึงจาก Network ไม่ได้ (เช่น ไม่มีเน็ต หรือ ออฟไลน์อยู่)
        // ค่อยวิ่งไปหาไฟล์ที่มีอยู่ใน Cache แทน
        return caches.match(event.request);
      })
  );
});
