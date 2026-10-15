const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const source = fs.readFileSync("site/sw.js", "utf8");
const scope = "https://learn.example/project/";
const stored = new Map();
const handlers = {};
const cache = {
  addAll(urls) { urls.forEach(url => stored.set(url, "cached:" + url)); return Promise.resolve(); },
  put(request, response) { stored.set(typeof request === "string" ? request : request.url, response); return Promise.resolve(); },
  match(request) { const key = typeof request === "string" ? request : request.url; return Promise.resolve(stored.get(key)); }
};
const caches = {
  open() { return Promise.resolve(cache); },
  match(request) { return cache.match(request); },
  keys() { return Promise.resolve(["zlearn-phase5-v1"]); },
  delete() { return Promise.resolve(true); }
};
const self = {
  location: new URL(scope),
  registration: {scope},
  clients: {claim() { return Promise.resolve(); }},
  skipWaiting() { return Promise.resolve(); },
  addEventListener(name, fn) { handlers[name] = fn; }
};
vm.runInNewContext(source, {self, caches, URL, Promise, fetch(){return Promise.reject(new Error("offline"));}});
assert(source.includes('"./index.html"'));
assert(source.includes('"./404.html"'));
assert(source.includes('"./assets/fonts/Amiri-Regular.ttf"'));
assert(source.includes('"./assets/fonts/IBMPlexSansArabic-Regular.woff2"'));

async function event(name, fields) {
  let responsePromise, waitPromise = Promise.resolve();
  const evt = Object.assign({}, fields, {
    waitUntil(p) { waitPromise = Promise.resolve(p); },
    respondWith(p) { responsePromise = Promise.resolve(p); }
  });
  handlers[name](evt);
  if (responsePromise) await responsePromise;
  await waitPromise;
}

(async function () {
  await event("install", {});
  const request = {method:"GET", mode:"navigate", url:scope+"nahw/01-lesson/index.html"};
  let response;
  handlers.fetch({request, waitUntil(p){p.catch(()=>{});}, respondWith(p){response=p;}});
  assert.strictEqual(await response, "cached:"+request.url, "cached lesson is available offline");
  console.log("offline cache tests passed");
}()).catch(e => { console.error(e); process.exit(1); });
