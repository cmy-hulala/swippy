/* Swippy service worker：首次載入後全部快取，之後離線可用。只快取同源檔案，不連任何外部服務。 */
/* 改到使用者會看到的檔案時，把 CACHE 往上加（swippy-v3、v4…）。名稱一變，activate 會清掉舊快取。 */
const CACHE="swippy-v2";
const CORE=["./","./index.html","./css/app.css","./js/app.js","./js/split.js","./js/samples.js","./js/i18n.js",
  "./manifest.json","./icons/icon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())) });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())) });
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET" || new URL(req.url).origin!==location.origin) return;
  // stale-while-revalidate：先給快取（離線也能開），背景再更新
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:req.mode==="navigate"}) || (req.mode==="navigate" ? await c.match("./index.html") : undefined);
    const net=fetch(req).then(r=>{ if(r && r.ok && r.type==="basic") c.put(req,r.clone()); return r }).catch(()=>undefined);
    if(hit){ e.waitUntil(net); return hit }
    return (await net) || new Response("Offline",{status:503,headers:{"Content-Type":"text/plain"}});
  }));
});
