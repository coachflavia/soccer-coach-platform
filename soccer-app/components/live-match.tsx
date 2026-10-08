"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GamesHeader, useGamesData } from "./games-ui";
import {
  activeMatch,
  buildSlots,
  deriveTeamStats,
  formationPresets,
  LIVE_MATCH_STORAGE_KEY,
  LineupSlot,
  LiveMatch,
  MatchEventType,
  MatchPhase,
  newId,
  playerTimes,
  safeCollection,
  saveCollection,
  secondsSince,
} from "../lib/games-data";
import { playerFullName } from "../lib/player-data";
import { PrepareOfflineMatch } from "./prepare-offline-match";

const stamp = () => new Date().toISOString();
const format = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
function identifySlotRoles(slots: LineupSlot[]) {
  const totals = new Map<string, number>(),
    seen = new Map<string, number>();
  for (const slot of slots) totals.set(slot.role, (totals.get(slot.role) || 0) + 1);
  return slots.map((slot) => {
    const index = (seen.get(slot.role) || 0) + 1;
    seen.set(slot.role, index);
    return {
      ...slot,
      role: (totals.get(slot.role) || 0) > 1 ? `${slot.role} ${index}` : slot.role,
    };
  });
}

export default function LiveMatchWorkspace() {
  const { fixtureId } = useParams<{ fixtureId: string }>(),
    d = useGamesData(),
    fixture = d.fixtures.find((f) => f.id === fixtureId),
    roster = d.rosters.find((r) => r.fixtureId === fixtureId),
    plan = d.plans.find(
      (p) =>
        p.fixtureId === fixtureId && (p.rosterId === roster?.id || !roster),
    );
  const [match, setMatchState] = useState<LiveMatch | null>(null),
    [now, setNow] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [assist, setAssist] = useState(""),
    [subOut, setSubOut] = useState<string | null>(null);
  function setMatch(next: LiveMatch | null) {
    if (next) {
      const all = safeCollection<LiveMatch>(
        localStorage.getItem(LIVE_MATCH_STORAGE_KEY),
      );
      saveCollection(
        LIVE_MATCH_STORAGE_KEY,
        all.some((saved) => saved.fixtureId === next.fixtureId)
          ? all.map((saved) => (saved.fixtureId === next.fixtureId ? next : saved))
          : [...all, next],
      );
    }
    setMatchState(next);
  }
  useEffect(() => {
    if (!fixture || !roster) return;
    const stored = safeCollection<LiveMatch>(
      localStorage.getItem(LIVE_MATCH_STORAGE_KEY),
    ).find((m) => m.fixtureId === fixtureId);
    const initialSlots = identifySlotRoles(
      plan?.lineup?.length ? plan.lineup : buildSlots(plan?.formation || ""),
    );
    if (stored) {
      setMatch({
        ...stored,
        activeFormation: stored.activeFormation || plan?.formation,
        liveSlots: stored.liveSlots || initialSlots,
      });
      return;
    }
    const starters = new Map(
      initialSlots
        .filter((s) => s.playerId)
        .map((s) => [s.playerId!, s]),
    );
    const at = stamp();
    setMatch({
      schemaVersion: 1,
      id: newId("live-match"),
      fixtureId,
      rosterId: roster.id,
      gamePlanId: plan?.id || null,
      phase: "NOT_STARTED",
      paused: false,
      elapsedSeconds: 0,
      clockStartedAt: null,
      activeFormation: plan?.formation,
      liveSlots: initialSlots,
      players: roster.playerIds.map((playerId) => {
        const slot = starters.get(playerId);
        return {
          playerId,
          started: !!slot,
          onField: !!slot,
          slotId: slot?.id || null,
          positionHistory: slot ? [slot.role] : [],
          playedSeconds: 0,
          benchSeconds: 0,
          stintStartedAt: null,
          benchStintStartedAt: null,
        };
      }),
      events: [],
      createdAt: at,
      updatedAt: at,
    });
  }, [fixtureId, fixture, roster, plan]);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const name = (id: string) => {
    const p = d.players.find((x) => x.id === id);
    return p
      ? playerFullName(p)
      : roster?.playerSnapshots.find((x) => x.playerId === id)?.name ||
          "Unknown player";
  };
  function settle(m: LiveMatch, at = stamp()): LiveMatch {
    const elapsed = activeMatch(m.phase, m.paused)
      ? secondsSince(m.clockStartedAt, new Date(at).getTime())
      : 0;
    return {
      ...m,
      elapsedSeconds: m.elapsedSeconds + elapsed,
      clockStartedAt: null,
      players: m.players.map((p) => ({
        ...p,
        playedSeconds:
          p.playedSeconds +
          (activeMatch(m.phase, m.paused) && p.onField
            ? secondsSince(p.stintStartedAt, new Date(at).getTime())
            : 0),
        benchSeconds:
          p.benchSeconds +
          (activeMatch(m.phase, m.paused) && !p.onField
            ? secondsSince(p.benchStintStartedAt, new Date(at).getTime())
            : 0),
        stintStartedAt: null,
        benchStintStartedAt: null,
      })),
    };
  }
  function event(
    m: LiveMatch,
    type: MatchEventType,
    extra: Partial<LiveMatch["events"][number]> = {},
  ) {
    const at = stamp(),
      sec =
        m.elapsedSeconds +
        (activeMatch(m.phase, m.paused)
          ? secondsSince(m.clockStartedAt, new Date(at).getTime())
          : 0);
    return {
      ...m,
      events: [
        ...m.events,
        {
          id: newId("event"),
          liveMatchId: m.id,
          type,
          phase: m.phase,
          matchSecond: sec,
          occurredAt: at,
          order: m.events.length,
          ...extra,
        },
      ],
    };
  }
  function transition(next: MatchPhase, type: MatchEventType) {
    if (!match) return;
    let m = settle(match);
    const at = stamp();
    m = {
      ...event(m, type),
      phase: next,
      paused: false,
      clockStartedAt:
        next === "FIRST_HALF" || next === "SECOND_HALF" ? at : null,
      players: m.players.map((p) => ({
        ...p,
        stintStartedAt:
          (next === "FIRST_HALF" || next === "SECOND_HALF") && p.onField
            ? at
            : null,
        benchStintStartedAt:
          (next === "FIRST_HALF" || next === "SECOND_HALF") && !p.onField
            ? at
            : null,
      })),
      updatedAt: at,
    };
    setMatch(m);
  }
  function togglePause() {
    if (!match) return;
    if (match.paused) {
      const at = stamp();
      setMatch({
        ...match,
        paused: false,
        clockStartedAt: at,
        players: match.players.map((p) => ({
          ...p,
          stintStartedAt: p.onField ? at : null,
          benchStintStartedAt: !p.onField ? at : null,
        })),
        updatedAt: at,
      });
    } else setMatch({ ...settle(match), paused: true, updatedAt: stamp() });
  }
  function add(
    type: MatchEventType,
    side: "US" | "OPPONENT",
    playerId?: string,
  ) {
    if (!match) return;
    setMatch({
      ...event(match, type, {
        side,
        playerId,
        assistPlayerId: type === "GOAL" && assist ? assist : undefined,
      }),
      updatedAt: stamp(),
    });
    setAssist("");
  }
  function substitute(outId: string, inId: string) {
    if (!match || !plan || outId === inId) return;
    const out = match.players.find((p) => p.playerId === outId),
      incoming = match.players.find((p) => p.playerId === inId);
    if (!out?.onField || incoming?.onField) return;
    let m = settle(match);
    const at = stamp(),
      running = activeMatch(match.phase, match.paused),
      liveSlots = match.liveSlots || plan.lineup,
      position = liveSlots.find((slot) => slot.id === out.slotId);
    m = {
      ...event(m, "SUBSTITUTION", {
        side: "US",
        playerOutId: outId,
        playerInId: inId,
      }),
      clockStartedAt: running ? at : null,
      players: m.players.map((p) =>
        p.playerId === outId
          ? {
              ...p,
              onField: false,
              slotId: null,
              benchStintStartedAt: running ? at : null,
            }
          : p.playerId === inId
            ? {
                ...p,
                onField: true,
                slotId: out.slotId,
                positionHistory: [
                  ...new Set([
                    ...p.positionHistory,
                    ...(position ? [position.role] : []),
                  ]),
                ],
                stintStartedAt: running ? at : null,
              }
            : {
                ...p,
                stintStartedAt: running && p.onField ? at : null,
                benchStintStartedAt: running && !p.onField ? at : null,
              },
      ),
      liveSlots: liveSlots.map((slot) =>
        slot.id === out.slotId ? { ...slot, playerId: inId } : slot,
      ),
      updatedAt: at,
    };
    setMatch(m);
    setSubOut(null);
  }
  function movePlayer(playerId: string, targetSlotId: string) {
    if (!match || !plan) return;
    const liveSlots = match.liveSlots || plan.lineup,
      player = match.players.find((p) => p.playerId === playerId),
      target = liveSlots.find((slot) => slot.id === targetSlotId),
      origin = liveSlots.find((slot) => slot.id === player?.slotId);
    if (!player?.onField || !target || !origin || target.id === origin.id) return;
    const other = target.playerId
      ? match.players.find((p) => p.playerId === target.playerId)
      : undefined;
    const at = stamp(),
      running = activeMatch(match.phase, match.paused);
    let next = settle(match);
    next = event(next, "POSITION_CHANGE", {
      side: "US",
      playerId,
      metadata: { from: origin.role, to: target.role },
    });
    if (other?.onField) {
      next = event(next, "POSITION_CHANGE", {
        side: "US",
        playerId: other.playerId,
        metadata: { from: target.role, to: origin.role },
      });
    }
    setMatch({
      ...next,
      clockStartedAt: running ? at : null,
      players: next.players.map((p) => {
        const destination =
          p.playerId === playerId
            ? target
            : other?.playerId === p.playerId
              ? origin
              : undefined;
        return {
          ...p,
          ...(destination
            ? {
                slotId: destination.id,
                positionHistory: [
                  ...new Set([...p.positionHistory, destination.role]),
                ],
              }
            : {}),
          stintStartedAt: running && p.onField ? at : null,
          benchStintStartedAt: running && !p.onField ? at : null,
        };
      }),
      liveSlots: liveSlots.map((slot) =>
        slot.id === origin.id
          ? { ...slot, playerId: other?.onField ? other.playerId : null }
          : slot.id === target.id
            ? { ...slot, playerId }
            : slot,
      ),
      updatedAt: at,
    });
  }
  function changeFormation(formation: string) {
    if (!match || !plan || formation === (match.activeFormation || plan.formation)) return;
    const running = activeMatch(match.phase, match.paused),
      at = stamp(),
      currentSlots = match.liveSlots || plan.lineup,
      orderedPlayers = [
        ...currentSlots
          .map((slot) => slot.playerId)
          .filter((id): id is string => Boolean(id)),
        ...match.players
          .filter((player) => player.onField)
          .map((player) => player.playerId)
          .filter((id) => !currentSlots.some((slot) => slot.playerId === id)),
      ],
      settled = settle(match),
      nextSlots = identifySlotRoles(buildSlots(formation)).map((slot, index) => ({
        ...slot,
        playerId: orderedPlayers[index] || null,
      })),
      assigned = new Map(
        nextSlots
          .filter((slot) => slot.playerId)
          .map((slot) => [slot.playerId!, slot]),
      );
    setMatch({
      ...settled,
      activeFormation: formation,
      liveSlots: nextSlots,
      clockStartedAt: running ? at : null,
      players: settled.players.map((player) => {
        const slot = assigned.get(player.playerId),
        onField = Boolean(slot);
        return {
          ...player,
          onField,
          slotId: slot?.id || null,
          positionHistory: slot
            ? [...new Set([...player.positionHistory, slot.role])]
            : player.positionHistory,
          stintStartedAt: running && onField ? at : null,
          benchStintStartedAt: running && !onField ? at : null,
        };
      }),
      updatedAt: at,
    });
  }
  if (!fixture)
    return (
      <Missing
        text="Fixture not found."
        href="/games/schedule"
        label="Back to Schedule"
      />
    );
  if (!roster)
    return (
      <Missing
        text="No roster has been created for this match yet."
        href={`/games/rosters/new?fixture=${fixture.id}`}
        label="Create roster"
      />
    );
  if (!plan)
    return (
      <Missing
        text="No Game Plan exists yet. Create one to initialize the formation and starting lineup."
        href={`/games/game-plans/new?fixture=${fixture.id}`}
        label="Create Game Plan"
      />
    );
  if (!match) return <main className="games-page">Loading match…</main>;
  const elapsed =
      match.elapsedSeconds +
      (activeMatch(match.phase, match.paused)
        ? secondsSince(match.clockStartedAt, now)
        : 0),
    stats = deriveTeamStats(match.events),
    team = d.teams.find((t) => t.id === fixture.teamId)?.name || "Our team",
    field = match.players.filter((p) => p.onField),
    bench = match.players.filter((p) => !p.onField),
    selectedPlayer = match.players.find((p) => p.playerId === selected),
    liveSlots = match.liveSlots || plan.lineup,
    supportedFormations = formationPresets[fixture.fieldFormat] || [];
  return (
    <main className="games-page">
      <GamesHeader
        eyebrow="Live match"
        title={`${team} vs ${fixture.opponentName}`}
      />
      <div className="mt-4">
        <PrepareOfflineMatch
          fixtureId={fixture.id}
          rosterId={roster.id}
          gamePlanId={plan.id}
          matchData={{
            fixture,
            team: d.teams.find((entry) => entry.id === fixture.teamId),
            roster,
            rosterPlayerSnapshots: roster.playerSnapshots,
            players: d.players.filter((player) => roster.playerIds.includes(player.id)),
            plan,
          }}
        />
      </div>
      <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 text-center">
        <p className="text-xs font-black tracking-[.24em] text-emerald-400">
          {match.paused ? "PAUSED" : match.phase.replaceAll("_", " ")}
        </p>
        <div className="my-3 font-mono text-6xl font-black tabular-nums">
          {format(elapsed)}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <b>{team}</b>
          <strong className="text-4xl">
            {stats.US.goals} — {stats.OPPONENT.goals}
          </strong>
          <button
            className="min-h-14 rounded-xl bg-rose-500/15 font-bold text-rose-200"
            onClick={() => add("GOAL", "OPPONENT")}
          >
            {fixture.opponentName}
            <small className="block">+ opponent goal</small>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {match.phase === "NOT_STARTED" && (
            <button
              className="training-primary"
              onClick={() => transition("FIRST_HALF", "MATCH_STARTED")}
            >
              START MATCH
            </button>
          )}
          {(match.phase === "FIRST_HALF" || match.phase === "SECOND_HALF") && (
            <button className="training-secondary" onClick={togglePause}>
              {match.paused ? "RESUME" : "PAUSE"}
            </button>
          )}
          {match.phase === "FIRST_HALF" && (
            <button
              className="training-danger"
              onClick={() =>
                confirm("End the first half?") &&
                transition("HALFTIME", "END_FIRST_HALF")
              }
            >
              END 1H
            </button>
          )}
          {match.phase === "HALFTIME" && (
            <button
              className="training-primary"
              onClick={() => transition("SECOND_HALF", "START_SECOND_HALF")}
            >
              START 2H / PLAY
            </button>
          )}
          {match.phase === "SECOND_HALF" && (
            <button
              className="training-danger"
              onClick={() =>
                confirm("End the match at full time?") &&
                transition("FULL_TIME", "FULL_TIME")
              }
            >
              END 2H / FULL TIME
            </button>
          )}
          {match.phase === "FULL_TIME" && (
            <Link
              className="training-primary"
              href={`/games/post-match/${fixtureId}`}
            >
              POST-MATCH REVIEW
            </Link>
          )}
        </div>
      </section>
      <section className="mt-6 training-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-400">FORMATION</p>
            <h2 className="text-xl font-bold">
              {match.activeFormation || plan.formation}
            </h2>
          </div>
          <label className="min-w-0 text-left text-xs text-slate-400">
            Change Formation
            <select
              className="training-input mt-1 min-h-12"
              value={match.activeFormation || plan.formation}
              onChange={(e) => changeFormation(e.target.value)}
            >
              {[...new Set([match.activeFormation || plan.formation, ...supportedFormations])].map(
                (formation) => (
                  <option key={formation} value={formation}>
                    {formation}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <div className="relative mt-4 aspect-[3/4] min-h-[470px] touch-none overflow-hidden rounded-2xl border-2 border-white/30 bg-emerald-900">
          <div className="absolute inset-x-0 top-1/2 border-t border-white/40" />
          {liveSlots.map((slot) => {
            const p = match.players.find(
                (player) => player.onField && player.slotId === slot.id,
              ),
              times = p ? playerTimes(p, match, now) : null;
            return (
              <button
                key={slot.id}
                onPointerDown={(e) => {
                  if (!p) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setSubOut(p.playerId);
                }}
                onPointerUp={(e) => {
                  if (!p) return;
                  const target = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest<HTMLElement>("[data-bench-player]");
                  if (target)
                    substitute(p.playerId, target.dataset.benchPlayer!);
                  else setSelected(p.playerId);
                }}
                onClick={() => {
                  if (!p && selectedPlayer) movePlayer(selectedPlayer.playerId, slot.id);
                }}
                className={`absolute min-h-16 w-28 -translate-x-1/2 -translate-y-1/2 touch-none rounded-xl border p-2 text-xs shadow-xl ${p ? "border-emerald-300/50 bg-slate-950/95" : "border-dashed border-white/50 bg-emerald-950/80"}`}
                style={{
                  left: `${(slot?.x || 0.5) * 100}%`,
                  top: `${(slot?.y || 0.5) * 100}%`,
                }}
              >
                <b className="block truncate">{p ? name(p.playerId) : "Open slot"}</b>
                <span className="block truncate text-emerald-200">{slot.role}</span>
                {times && (
                  <span className="text-emerald-300">PLAYED {format(times.played)}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <section className="mt-6 training-panel">
        <h2 className="text-xl font-bold">BENCH</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bench.map((p) => {
            const t = playerTimes(p, match, now);
            return (
              <button
                data-bench-player={p.playerId}
                key={p.playerId}
                onClick={() =>
                  subOut
                    ? substitute(subOut, p.playerId)
                    : setSelected(p.playerId)
                }
                className={`min-h-20 rounded-xl border p-3 text-left ${subOut ? "border-amber-400 bg-amber-400/10" : "border-slate-700 bg-slate-950"}`}
              >
                <b>{name(p.playerId)}</b>
                <span className="mt-1 block text-xs text-slate-400">
                  PLAYED {format(t.played)} · BENCH {format(t.currentBench)}
                </span>
                {subOut && (
                  <span className="text-xs font-bold text-amber-300">
                    Tap to replace {name(subOut)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {field.length > 0 && bench.length > 0 && (
          <div className="mt-4 flex gap-2">
            <select
              className="training-input"
              value={subOut || ""}
              onChange={(e) => setSubOut(e.target.value || null)}
            >
              <option value="">Accessible substitution: player off…</option>
              {field.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {name(p.playerId)}
                </option>
              ))}
            </select>
            {subOut && (
              <button
                className="training-secondary"
                onClick={() => setSubOut(null)}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </section>
      {selectedPlayer && (
        <section className="sticky bottom-3 z-30 mt-6 rounded-2xl border border-emerald-400 bg-slate-900 p-4 shadow-2xl">
          <div className="flex justify-between">
            <h2 className="font-bold">
              Quick actions · {name(selectedPlayer.playerId)}
            </h2>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>
          {selectedPlayer.onField && (
            <label className="mt-3 block text-sm">
              Move to position
              <select
                className="training-input mt-1 min-h-12"
                value=""
                onChange={(e) => movePlayer(selectedPlayer.playerId, e.target.value)}
              >
                <option value="">Choose a slot</option>
                {liveSlots
                  .filter((slot) => slot.id !== selectedPlayer.slotId)
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.role}{slot.playerId ? ` · swap with ${name(slot.playerId)}` : " · open"}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label className="mt-3 block text-sm">
            Optional assist for next goal
            <select
              className="training-input mt-1"
              value={assist}
              onChange={(e) => setAssist(e.target.value)}
            >
              <option value="">No assist</option>
              {match.players
                .filter((p) => p.playerId !== selected)
                .map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {name(p.playerId)}
                  </option>
                ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-7">
            {[
              ["G", "GOAL"],
              ["YC", "YELLOW_CARD"],
              ["RC", "RED_CARD"],
              ["SHOT", "SHOT"],
              ["SOT", "SHOT_ON_TARGET"],
              ["FOUL", "FOUL"],
            ].map(([label, type]) => (
              <button
                key={type}
                className="training-small min-h-12"
                onClick={() =>
                  add(type as MatchEventType, "US", selectedPlayer.playerId)
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
      <Stats stats={stats} add={add} />
      <section className="mt-6 training-panel">
        <h2 className="text-xl font-bold">Timeline</h2>
        <div className="mt-3 space-y-2">
          {[...match.events].reverse().map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg bg-slate-950 p-3 text-sm"
            >
              <span>
                <b>
                  {Math.floor(e.matchSecond / 60)}′{" "}
                  {e.type.replaceAll("_", " ")}
                </b>{" "}
                {e.playerId && `— ${name(e.playerId)}`}{" "}
                {e.assistPlayerId && `(assist: ${name(e.assistPlayerId)})`}{" "}
                {e.playerOutId &&
                  `— ${name(e.playerOutId)} → ${name(e.playerInId!)}`}
              </span>
              <button
                aria-label="Delete event"
                className="text-rose-300"
                onClick={() =>
                  setMatch({
                    ...match,
                    events: match.events.filter((x) => x.id !== e.id),
                    updatedAt: stamp(),
                  })
                }
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
function Stats({
  stats,
  add,
}: {
  stats: ReturnType<typeof deriveTeamStats>;
  add: (t: MatchEventType, s: "US" | "OPPONENT", p?: string) => void;
}) {
  const rows: [
    [string, keyof typeof stats.US, MatchEventType],
    ...Array<[string, keyof typeof stats.US, MatchEventType]>,
  ] = [
    ["Goals", "goals", "GOAL"],
    ["Shots", "shots", "SHOT"],
    ["On target", "shotsOnTarget", "SHOT_ON_TARGET"],
    ["Corners", "corners", "CORNER"],
    ["Fouls", "fouls", "FOUL"],
    ["Offsides", "offsides", "OFFSIDE"],
  ];
  return (
    <section className="mt-6 training-panel">
      <h2 className="text-xl font-bold">Team statistics</h2>
      <div className="mt-4 space-y-2">
        {rows.map(([label, key, type]) => (
          <div
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
            key={key}
          >
            <button className="training-small" onClick={() => add(type, "US")}>
              + {stats.US[key]}
            </button>
            <b className="text-xs uppercase text-slate-400">{label}</b>
            <button
              className="training-small"
              onClick={() => add(type, "OPPONENT")}
            >
              {stats.OPPONENT[key]} +
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
function Missing({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <main className="games-page">
      <GamesHeader title="Live Match" />
      <section className="mt-8 training-panel">
        <p className="text-amber-200">{text}</p>
        <Link className="training-primary mt-4 inline-block" href={href}>
          {label}
        </Link>
      </section>
    </main>
  );
}
