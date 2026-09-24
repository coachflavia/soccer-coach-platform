"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";

const TEAM_STORAGE_KEY = "soccer-coach-teams";

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  gender: string;
  teamType: string;
  club: string;
  season: string;
};

const dashboardSections = [
  {
    title: "Players",
    description: "Build your roster and keep player details organized.",
    icon: "♟",
  },
  {
    title: "Training",
    description: "Plan sessions, drills, and weekly development goals.",
    icon: "◇",
  },
  {
    title: "Games",
    description: "Prepare fixtures and review your match schedule.",
    icon: "⚽",
  },
  {
    title: "Attendance",
    description: "Track availability across training sessions and games.",
    icon: "✓",
  },
];

function subscribeToTeams(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredTeams() {
  return window.localStorage.getItem(TEAM_STORAGE_KEY);
}

function parseTeams(storedTeams: string | null): Team[] {
  if (!storedTeams) {
    return [];
  }

  try {
    const parsedTeams: unknown = JSON.parse(storedTeams);

    return Array.isArray(parsedTeams) ? (parsedTeams as Team[]) : [];
  } catch {
    return [];
  }
}

export default function TeamDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const storedTeams = useSyncExternalStore(
    subscribeToTeams,
    getStoredTeams,
    () => null,
  );
  const team = parseTeams(storedTeams).find((item) => item.id === id);

  if (!team) {
    return (
      <main className="flex min-h-screen items-center bg-slate-950 px-6 text-white">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-2xl">
            ⚽
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Team not found
          </p>
          <h1 className="mt-2 text-3xl font-bold">We couldn&apos;t find this team</h1>
          <p className="mt-3 text-slate-400">
            It may have been removed, or this link may no longer be valid.
          </p>
          <Link
            href="/teams"
            className="mt-7 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Back to My Teams
          </Link>
        </div>
      </main>
    );
  }

  const teamDetails = [
    ["Age Group", team.ageGroup],
    ["Gender", team.gender],
    ["Team Type", team.teamType],
    ["Club", team.club || "Independent team"],
    ["Season", team.season],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-400"
        >
          <span aria-hidden="true">←</span>
          Back to My Teams
        </Link>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 to-emerald-950/40 px-8 py-10 sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Team Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {team.name}
            </h1>
            <p className="mt-3 text-slate-400">
              Everything you need to organize your team this season.
            </p>
          </div>

          <dl className="grid gap-px bg-slate-800 sm:grid-cols-2 lg:grid-cols-5">
            {teamDetails.map(([label, value]) => (
              <div key={label} className="bg-slate-900 px-8 py-6">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </dt>
                <dd className="mt-2 font-semibold text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="manage-team-heading">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Team Management
            </p>
            <h2 id="manage-team-heading" className="mt-2 text-2xl font-bold">
              Manage your team
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardSections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-400">
                  <span aria-hidden="true">{section.icon}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {section.description}
                </p>
                <span className="mt-5 inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
