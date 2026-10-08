export const OFFLINE_MATCHES_STORAGE_KEY = "soccer-coach-offline-matches-v1";
export const OFFLINE_MATCHES_EVENT = "soccer-coach-offline-matches-updated";

export type PreparedOfflineMatch = {
  fixtureId: string;
  preparedAt: string;
  schemaVersion: 1;
  fingerprint: string;
};

export function offlineMatchFingerprint(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function readPreparedOfflineMatches(raw?: string | null): PreparedOfflineMatch[] {
  try {
    const value: unknown = JSON.parse(
      raw ?? localStorage.getItem(OFFLINE_MATCHES_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter(
          (entry): entry is PreparedOfflineMatch =>
            entry &&
            typeof entry.fixtureId === "string" &&
            typeof entry.preparedAt === "string" &&
            entry.schemaVersion === 1 &&
            typeof entry.fingerprint === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function savePreparedOfflineMatch(match: PreparedOfflineMatch) {
  const matches = readPreparedOfflineMatches();
  localStorage.setItem(
    OFFLINE_MATCHES_STORAGE_KEY,
    JSON.stringify([
      ...matches.filter((entry) => entry.fixtureId !== match.fixtureId),
      match,
    ]),
  );
  window.dispatchEvent(new Event(OFFLINE_MATCHES_EVENT));
}

export async function cacheMatchDayRoutes({
  fixtureId,
  rosterId,
  gamePlanId,
}: {
  fixtureId: string;
  rosterId: string;
  gamePlanId: string;
}) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Offline storage is not supported by this browser.");
  }
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller || registration.active;
  if (!worker) throw new Error("The offline service worker is not ready.");

  const channel = new MessageChannel();
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("Preparing the match took too long. Please try again."));
    }, 30_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; error?: string }>) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (event.data.ok) resolve();
      else reject(new Error(event.data.error || "Unable to prepare this match."));
    };
    worker.postMessage(
      {
        type: "PREPARE_OFFLINE_MATCH",
        fixtureId,
        rosterId,
        gamePlanId,
      },
      [channel.port2],
    );
  });
}
