"use client";

import { useState } from "react";
import {
  cacheMatchDayRoutes,
  offlineMatchFingerprint,
  readPreparedOfflineMatches,
  savePreparedOfflineMatch,
} from "../lib/offline-match";

export function PrepareOfflineMatch({
  fixtureId,
  rosterId,
  gamePlanId,
  matchData,
}: {
  fixtureId: string;
  rosterId: string;
  gamePlanId: string;
  matchData: unknown;
}) {
  const fingerprint = offlineMatchFingerprint(matchData);
  const ready = readPreparedOfflineMatches().some(
    (match) => match.fixtureId === fixtureId && match.fingerprint === fingerprint,
  );
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");

  async function prepare() {
    setPreparing(true);
    setMessage("");
    try {
      await cacheMatchDayRoutes({ fixtureId, rosterId, gamePlanId });
      savePreparedOfflineMatch({
        fixtureId,
        preparedAt: new Date().toISOString(),
        schemaVersion: 1,
        fingerprint,
      });
      setMessage("Match prepared on this device.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to prepare this match. Please try again.",
      );
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        className="training-secondary"
        disabled={preparing}
        onClick={prepare}
        type="button"
      >
        {preparing ? "Preparing…" : ready ? "Refresh offline match" : "Prepare offline"}
      </button>
      {message && (
        <p aria-live="polite" className="max-w-xs text-xs text-slate-300">
          {message}
        </p>
      )}
      <p className="max-w-xs text-xs text-slate-500">
        Caches this fixture’s Games, schedule, roster, Game Plan, Live Match, and Post-Match
        pages using this device’s data. No server sync.
      </p>
    </div>
  );
}
