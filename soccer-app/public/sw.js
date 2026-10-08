const STATIC_CACHE = "coach-hub-static-v3";
const PAGE_CACHE = "coach-hub-pages-v3";
const MATCH_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const APP_FALLBACK = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await cache.add("/offline.html");
      try {
        const response = await fetch("/games", { headers: { Accept: "text/html" } });
        if (response.ok) await cache.put("/games", response);
      } catch {
        // The offline fallback remains available if first installation is offline.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("coach-hub-") && ![STATIC_CACHE, PAGE_CACHE].includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "PREPARE_OFFLINE_MATCH" || !event.ports[0]) return;
  event.waitUntil(prepareMatch(event.data, event.ports[0]));
});

async function prepareMatch({ fixtureId, rosterId, gamePlanId }, port) {
  try {
    if (
      ![fixtureId, rosterId, gamePlanId].every(
        (id) => typeof id === "string" && MATCH_ID_PATTERN.test(id),
      )
    ) {
      throw new Error("Invalid match preparation request.");
    }
    const encodedFixtureId = encodeURIComponent(fixtureId);
    const routes = [
      "/games",
      "/games/schedule",
      "/games/rosters",
      "/games/game-plans",
      `/games/schedule/${encodedFixtureId}`,
      `/games/rosters/${encodeURIComponent(rosterId)}`,
      `/games/game-plans/${encodeURIComponent(gamePlanId)}`,
      `/games/live/${encodedFixtureId}`,
      `/games/post-match/${encodedFixtureId}`,
    ];
    const pageCache = await caches.open(PAGE_CACHE);
    const assetUrls = new Set();

    for (const route of routes) {
      const response = await fetch(route, {
        headers: { Accept: "text/html" },
        cache: "reload",
      });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("text/html")
      ) {
        throw new Error(`Could not prepare ${route} for offline use.`);
      }
      const html = await response.clone().text();
      await pageCache.put(route, response);
      for (const assetUrl of findStaticAssets(html)) assetUrls.add(assetUrl);
    }

    await cacheStaticAssets(assetUrls);
    port.postMessage({ ok: true });
  } catch (error) {
    port.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to prepare this match.",
    });
  } finally {
    port.close();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (url.pathname === "/games" || url.pathname.startsWith("/games/")) {
      event.respondWith(handleNavigation(request, url.pathname));
    }
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleStaticAsset(request));
  }
});

async function handleNavigation(request, pathname) {
  const pageCache = await caches.open(PAGE_CACHE);
  const cachePath = normalizePath(pathname);

  try {
    const response = await fetch(request);
    if (response.ok && cachePath === "/games") {
      await pageCache.put(cachePath, response.clone());
    }
    return response;
  } catch {
    return (
      (await pageCache.match(cachePath)) ||
      (await pageCache.match(APP_FALLBACK)) ||
      Response.error()
    );
  }
}

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function findStaticAssets(html) {
  const assets = new Set();
  for (const match of html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)) {
    const url = new URL(match[1], self.location.origin);
    if (url.origin === self.location.origin) assets.add(url.href);
  }
  return assets;
}

async function cacheStaticAssets(initialUrls) {
  const cache = await caches.open(STATIC_CACHE);
  const pending = [...initialUrls];
  const seen = new Set();
  while (pending.length > 0) {
    const assetUrl = pending.pop();
    if (seen.has(assetUrl)) continue;
    seen.add(assetUrl);

    const response = await fetch(assetUrl);
    if (!isValidStaticAssetResponse(new Request(assetUrl), response)) {
      throw new Error(`Could not cache required app asset: ${new URL(assetUrl).pathname}`);
    }
    const contentType = response.headers.get("content-type") || "";
    const cssText = contentType.includes("text/css")
      ? await response.clone().text()
      : "";
    await cache.put(assetUrl, response);

    if (contentType.includes("text/css")) {
      for (const match of cssText.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        const url = new URL(match[1], assetUrl);
        if (
          url.origin === self.location.origin &&
          url.pathname.startsWith("/_next/static/") &&
          !seen.has(url.href)
        ) {
          pending.push(url.href);
        }
      }
    }
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (isValidStaticAssetResponse(request, response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error(`Static asset is unavailable offline: ${new URL(request.url).pathname}`);
  }
}

function isValidStaticAssetResponse(request, response) {
  if (!response.ok) return false;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) return false;

  const pathname = new URL(request.url).pathname;
  if (pathname.endsWith(".css")) return contentType.includes("text/css");
  if (/\.(?:js|mjs)$/.test(pathname)) {
    return /(?:javascript|ecmascript)/i.test(contentType);
  }
  return true;
}
