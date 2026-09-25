import Link from "next/link";
import { TeamForm } from "../../../components/team-form";

export default function NewTeamPage() {
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-3xl px-6 py-10">
    <Link href="/teams" className="text-sm font-semibold text-slate-400 hover:text-emerald-400">← Back to My Teams</Link>
    <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-emerald-400">My Teams</p>
    <h1 className="mt-2 text-4xl font-bold">Create a Team</h1>
    <p className="mt-2 text-slate-400">Add team information and optional club branding.</p>
    <TeamForm />
  </div></main>;
}
