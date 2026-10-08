"use client";

import Link from "next/link";
import { PrepareOfflineMatch } from "../../components/prepare-offline-match";
import { GamesHeader, useGamesData } from "../../components/games-ui";
import { fixtureStart } from "../../lib/games-data";

export default function GamesPage() {
  const data = useGamesData();
  const upcoming = data.fixtures
    .filter(
      (fixture) =>
        fixture.status === "Scheduled" &&
        fixtureStart(fixture) >= new Date().toISOString().slice(0, 16),
    )
    .sort((a, b) => fixtureStart(a).localeCompare(fixtureStart(b)));
  const teamName = (teamId: string) =>
    data.teams.find((team) => team.id === teamId)?.name || "Unknown team";
  const cards = [
    {
      title: "Schedule",
      description: "Enter match details once.",
      href: "/games/schedule",
      count: data.fixtures.length,
    },
    {
      title: "Rosters",
      description: "Select attending players.",
      href: "/games/rosters",
      count: data.rosters.length,
    },
    {
      title: "Game Plans",
      description: "Build the match dossier.",
      href: "/games/game-plans",
      count: data.plans.length,
    },
  ];

  return (
    <main className="games-page">
      <GamesHeader title="Games Center" />
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(({ title, description, href, count }) => (
          <Link
            key={title}
            href={href}
            className="training-panel transition hover:border-emerald-500/50"
          >
            <p className="text-xs font-bold uppercase text-emerald-400">{count} records</p>
            <h2 className="mt-3 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </Link>
        ))}
      </section>
      <section className="mt-8 training-panel">
        <h2 className="text-xl font-bold">Upcoming fixtures</h2>
        <p className="mt-2 text-sm text-slate-400">
          Prepare a fixture while online to cache its Live Match page for this device.
        </p>
        <div className="mt-4 space-y-3">
          {upcoming.slice(0, 5).map((fixture) => {
            const team = data.teams.find((entry) => entry.id === fixture.teamId);
            const roster = data.rosters.find((entry) => entry.fixtureId === fixture.id);
            const plan = data.plans.find(
              (entry) => entry.fixtureId === fixture.id && entry.rosterId === roster?.id,
            );
            const players = roster
              ? data.players.filter((player) => roster.playerIds.includes(player.id))
              : [];
            const matchData = {
              fixture,
              team,
              roster,
              rosterPlayerSnapshots: roster?.playerSnapshots,
              players,
              plan,
            };

            return (
              <article
                key={fixture.id}
                className="flex flex-col gap-4 rounded-xl bg-slate-950 p-4 lg:flex-row lg:items-center"
              >
                <Link className="min-w-0 flex-1" href={`/games/schedule/${fixture.id}`}>
                  <b>
                    {teamName(fixture.teamId)} vs {fixture.opponentName}
                  </b>
                  <small className="block text-slate-400">
                    {fixture.competition} · {fixture.venue || "Venue TBD"} · {fixture.date}{" "}
                    {fixture.kickoffTime}
                  </small>
                </Link>
                <div className="flex flex-wrap items-start gap-2">
                  <Link className="training-primary" href={`/games/live/${fixture.id}`}>
                    Live Match
                  </Link>
                  <Link
                    className="training-secondary"
                    href={`/games/post-match/${fixture.id}`}
                  >
                    Post-Match
                  </Link>
                  {team && roster && plan ? (
                    <PrepareOfflineMatch
                      fixtureId={fixture.id}
                      rosterId={roster.id}
                      gamePlanId={plan.id}
                      matchData={matchData}
                    />
                  ) : (
                    <p className="max-w-xs text-xs text-amber-200">
                      Add this fixture’s team, roster, and Game Plan before preparing it
                      offline.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
          {!upcoming.length && (
            <p className="text-slate-400">
              No upcoming fixtures. Create the first match in Schedule.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
