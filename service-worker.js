!function(){"use strict";const t=1620670237947,i="cache"+t,e=["client/client.388290e7.js","client/index.53c4a16b.js","client/about.7dad6aab.js","client/index.43466ccf.js","client/[slug].54814469.js"].concat(["service-worker-index.html","fonts/merriweather-latin-300.woff","fonts/merriweather-latin-300.woff2","fonts/merriweather-latin-300italic.woff","fonts/merriweather-latin-300italic.woff2","fonts/merriweather-latin-400.woff","fonts/merriweather-latin-400.woff2","fonts/merriweather-latin-400italic.woff","fonts/merriweather-latin-400italic.woff2","fonts/merriweather-latin-700.woff","fonts/merriweather-latin-700.woff2","fonts/merriweather-latin-700italic.woff","fonts/merriweather-latin-700italic.woff2","fonts/merriweather-latin-900.woff","fonts/merriweather-latin-900.woff2","fonts/merriweather-latin-900italic.woff","fonts/merriweather-latin-900italic.woff2","fonts/rubik-latin-300.woff","fonts/rubik-latin-300.woff2","fonts/rubik-latin-300italic.woff","fonts/rubik-latin-300italic.woff2","fonts/rubik-latin-400.woff","fonts/rubik-latin-400.woff2","fonts/rubik-latin-400italic.woff","fonts/rubik-latin-400italic.woff2","fonts/rubik-latin-500.woff","fonts/rubik-latin-500.woff2","fonts/rubik-latin-500italic.woff","fonts/rubik-latin-500italic.woff2","fonts/rubik-latin-700.woff","fonts/rubik-latin-700.woff2","fonts/rubik-latin-700italic.woff","fonts/rubik-latin-700italic.woff2","fonts/rubik-latin-900.woff","fonts/rubik-latin-900.woff2","fonts/rubik-latin-900italic.woff","fonts/rubik-latin-900italic.woff2","fonts.css","global.css","highlight.css","logo.svg","manifest.json","undraw-illustration.svg"]),n=new Set(e);self.addEventListener("install",t=>{t.waitUntil(caches.open(i).then(t=>t.addAll(e)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",t=>{t.waitUntil(caches.keys().then(async t=>{for(const e of t)e!==i&&await caches.delete(e);self.clients.claim()}))}),self.addEventListener("fetch",i=>{if("GET"!==i.request.method||i.request.headers.has("range"))return;const e=new URL(i.request.url);e.protocol.startsWith("http")&&(e.hostname===self.location.hostname&&e.port!==self.location.port||(e.host===self.location.host&&n.has(e.pathname)?i.respondWith(caches.match(i.request)):"only-if-cached"!==i.request.cache&&i.respondWith(caches.open("offline"+t).then(async t=>{try{const e=await fetch(i.request);return t.put(i.request,e.clone()),e}catch(e){const n=await t.match(i.request);if(n)return n;throw e}}))))})}();
