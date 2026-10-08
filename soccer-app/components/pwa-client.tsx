"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  OFFLINE_MATCHES_EVENT,
  readPreparedOfflineMatches,
} from "../lib/offline-match";
import type { PreparedOfflineMatch } from "../lib/offline-match";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaClient() {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [preparedMatches, setPreparedMatches] = useState<PreparedOfflineMatch[] | null>(
    null,
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    let active = true;
    const updateConnection = () => setOnline(navigator.onLine);
    const updatePreparedMatches = () => {
      if (active) setPreparedMatches(readPreparedOfflineMatches());
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleOfflineGamesNavigation = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const target = new URL(anchor.href);
      if (
        target.origin !== window.location.origin ||
        (target.pathname !== "/games" && !target.pathname.startsWith("/games/"))
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(target.href);
    };

    updateConnection();
    updatePreparedMatches();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("storage", updatePreparedMatches);
    window.addEventListener(OFFLINE_MATCHES_EVENT, updatePreparedMatches);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("click", handleOfflineGamesNavigation, true);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("Could not register the offline service worker.", error);
      });
    }

    return () => {
      active = false;
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("storage", updatePreparedMatches);
      window.removeEventListener(
        OFFLINE_MATCHES_EVENT,
        updatePreparedMatches,
      );
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("click", handleOfflineGamesNavigation, true);
    };
  }, []);

  const liveMatchId = pathname.match(/^\/games\/live\/([^/]+)\/?$/)?.[1];
  const liveMatchIsReady = liveMatchId
    ? (preparedMatches || []).some(
        (match) => match.fixtureId === decodeURIComponent(liveMatchId),
      )
    : false;
  const connectionLabel = online ? "Online" : "Offline — saving on this device";

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <div className="border-b border-slate-800 bg-slate-950/90 text-white">
      <div className="mx-auto flex min-h-11 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs font-semibold sm:px-6">
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <span
            className={`rounded-full px-3 py-1 ${
              online
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-200"
            }`}
          >
            {connectionLabel}
          </span>
          {preparedMatches && liveMatchId && (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
              {liveMatchIsReady ? "Ready for offline use" : "Not prepared for offline use"}
            </span>
          )}
          {preparedMatches && !liveMatchId && preparedMatches.length > 0 && (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
              {preparedMatches.length}{" "}
              {preparedMatches.length === 1 ? "match" : "matches"} prepared
            </span>
          )}
        </div>
        {installPrompt && (
          <button className="training-secondary min-h-9 px-3 py-1" onClick={installApp}>
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
