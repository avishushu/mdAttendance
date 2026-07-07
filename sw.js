
const VERSION = 'v1.0.2'; // חשוב: תעלה מספר את זה (v3, v4...) בכל דיפלוי משמעותי

self.addEventListener('install', (event) => {
    self.skipWaiting(); // גורם לגרסה החדשה של ה-SW להיכנס לתוקף מיד
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); // תופס שליטה על כל הלשוניות הפתוחות מיד
});

self.addEventListener('fetch', (event) => {
    // קובץ שירות בסיסי להפעלת PWA — ללא caching
});


//self.addEventListener('fetch', (event) => {
    // קובץ שירות בסיסי להפעלת PWA
//});
