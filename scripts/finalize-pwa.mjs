import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const buildId = (process.env.GITHUB_SHA ?? `local-${Date.now()}`).slice(0, 16);
const builtAt = new Date().toISOString();

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function urlFor(relativePath) {
  return `${basePath}/${relativePath}`.replace(/\/+/g, "/");
}

await writeFile(
  path.join(root, "app-version.json"),
  JSON.stringify({ buildId, builtAt }, null, 2),
  "utf8",
);

const files = await walk(root);
const precache = new Set();
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (relative === "sw.js") continue;
  precache.add(urlFor(relative));

  if (relative === "index.html") {
    precache.add(`${basePath}/` || "/");
  } else if (relative.endsWith("/index.html")) {
    const directory = relative.slice(0, -"index.html".length);
    precache.add(urlFor(directory));
  }
}

const serviceWorker = `const CACHE = ${JSON.stringify(`testapp-shell-${buildId}`)};
const CACHE_PREFIX = "testapp-shell-";
const PRECACHE = ${JSON.stringify([...precache].sort(), null, 2)};
const OFFLINE_ROOT = ${JSON.stringify(`${basePath}/` || "/")};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(OFFLINE_ROOT)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.origin === self.location.origin) event.respondWith(cacheFirst(event.request));
});
`;

await writeFile(path.join(root, "sw.js"), serviceWorker, "utf8");
console.log(`[pwa] Generated ${path.join(root, "sw.js")} with ${precache.size} precached URLs (${buildId}).`);
