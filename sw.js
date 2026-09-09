const VERSION = 'v1.1.1.0'; 
const CACHE_NAME = `im-here-${VERSION}`;

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './micon.png',
    './micon2.png',
    './micon4.png',
];

const NEVER_INTERCEPT_HOSTS = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'www.googleapis.com',
];


const FIREBASE_SDK_HOST = 'www.gstatic.com';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .catch((err) => console.warn('SW precache failed (non-fatal):', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return; 

    const url = new URL(req.url);
if (NEVER_INTERCEPT_HOSTS.includes(url.hostname)) return;

        if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
                    return res;
                })
                .catch(() => caches.match('./index.html').then((res) => res || caches.match('./')))
        );
        return;
    }

    if (url.hostname === FIREBASE_SDK_HOST) {
        event.respondWith(
            caches.match(req).then((cached) => cached || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                return res;
            }))
        );
        return;
    }

        if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const networkFetch = fetch(req).then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    return res;
                }).catch(() => cached);
                return cached || networkFetch;
            })
        );
        return;
    }

});


self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (err) {
        console.warn('Push payload was not valid JSON:', err);
    }

    const notif = payload.notification || {};
    const data = payload.data || {};

    const title = notif.title || data.title || 'Im Here';
    const body = notif.body || data.body || '';
    const targetUrl = data.url || './';

    const options = {
        body,
        icon: './micon4.png',
        badge: './micon4.png',
        dir: 'rtl',
        lang: 'he',
        data: { url: targetUrl },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const rawUrl = (event.notification.data && event.notification.data.url) || './';
    const targetUrl = new URL(rawUrl, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && new URL(client.url).origin === self.location.origin && 'focus' in client) {
                    if ('navigate' in client) {
                        return client.navigate(targetUrl).then((c) => c.focus());
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
