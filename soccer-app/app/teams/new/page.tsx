"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function NewTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [teamType, setTeamType] = useState("");
  const [club, setClub] = useState("");
  const [season, setSeason] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!teamName || !ageGroup || !gender || !teamType || !season) {
      setError("Complete all required fields before creating the team.");
      return;
    }

    const storedTeams = window.localStorage.getItem(TEAM_STORAGE_KEY);
    const teams: Team[] = storedTeams ? JSON.parse(storedTeams) : [];
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: teamName.trim(),
      ageGroup,
      gender,
      teamType,
      club: club.trim(),
      season: season.trim(),
    };

    window.localStorage.setItem(
      TEAM_STORAGE_KEY,
      JSON.stringify([...teams, newTeam]),
    );
    router.push("/teams");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            My Teams
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Create a Team
          </h1>

          <p className="mt-2 text-slate-400">
            Add your team information to get started.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="team-name" className="text-sm font-medium text-slate-300">
                Team Name
              </label>

              <input
                id="team-name"
                type="text"
                placeholder="Example: Chicago United 2013 Girls"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="age-group" className="text-sm font-medium text-slate-300">
                Age Group
              </label>

              <select
                id="age-group"
                value={ageGroup}
                onChange={(event) => setAgeGroup(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="">Select age group</option>
                <option>U6</option>
                <option>U7</option>
                <option>U8</option>
                <option>U9</option>
                <option>U10</option>
                <option>U11</option>
                <option>U12</option>
                <option>U13</option>
                <option>U14</option>
                <option>U15</option>
                <option>U16</option>
                <option>U17</option>
                <option>U18</option>
                <option>U19</option>
                <option>Adult</option>
              </select>
            </div>

            <div>
              <label htmlFor="gender" className="text-sm font-medium text-slate-300">
                Gender
              </label>

              <select
                id="gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="">Select gender</option>
                <option>Girls / Women</option>
                <option>Boys / Men</option>
                <option>Mixed</option>
              </select>
            </div>

            <div>
              <label htmlFor="team-type" className="text-sm font-medium text-slate-300">
                Team Type
              </label>

              <select
                id="team-type"
                value={teamType}
                onChange={(event) => setTeamType(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="">Select team type</option>
                <option>Competitive</option>
                <option>Recreational</option>
                <option>School</option>
                <option>Academy</option>
              </select>
            </div>

            <div>
              <label htmlFor="club" className="text-sm font-medium text-slate-300">
                Club
              </label>

              <input
                id="club"
                type="text"
                placeholder="Example: Chicago United FC"
                value={club}
                onChange={(event) => setClub(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="season" className="text-sm font-medium text-slate-300">
                Season
              </label>

              <input
                id="season"
                type="text"
                placeholder="Example: 2026–2027"
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Create Team
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}