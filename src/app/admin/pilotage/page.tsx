import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Pilotage produit · Admin"};

const label: Record<string, string> = { en_cours: "En cours", accepte: "Accepté", refuse: "Refusé", abandonne: "Abandonné" };

export default async function PilotagePage() {
  if (!(await getAdminEmail())) notFound();
  const admin = createAdminClient();
  const [{ data: dossiers }, { data: retours }, { data: obliges }] = await Promise.all([
    admin.from("dossiers").select("id, oblige_id, created_at").order("created_at", { ascending: false }),
    admin.from("retours_depot").select("dossier_id, statut, motif"),
    admin.from("obliges").select("id, nom"),
  ]);
  const dossierRows = dossiers ?? [];
  const retourRows = retours ?? [];
  const avecOblige = dossierRows.filter((d) => d.oblige_id).length;
  const comptes = Object.fromEntries(["en_cours", "accepte", "refuse", "abandonne"].map((s) => [s, retourRows.filter((r) => r.statut === s).length]));
  const motifs = new Map<string, number>();
  for (const r of retourRows) if (r.statut === "refuse" && r.motif) motifs.set(r.motif, (motifs.get(r.motif) ?? 0) + 1);
  const obligeParId = new Map((obliges ?? []).map((o) => [o.id, o.nom]));
  const parOblige = new Map<string, number>();
  for (const d of dossierRows) {
    const nom = d.oblige_id ? obligeParId.get(d.oblige_id) ?? "Obligé supprimé" : "Non choisi";
    parOblige.set(nom, (parOblige.get(nom) ?? 0) + 1);
  }
  return <main className="mx-auto max-w-4xl px-8 py-10">
    <Link href="/admin/regles" className="inline-flex items-center gap-1 text-sm text-tampon underline-offset-4 hover:underline"><ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />Règles métier</Link>
    <h1 className="mt-4 font-serif text-3xl font-semibold text-encre">Pilotage terrain</h1>
    <p className="mt-2 text-sm text-ardoise">Données déclarées après dépôt. Elles orientent les revues de règles ; elles ne prouvent pas seules une exigence réglementaire.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Dossiers créés" value={dossierRows.length} /><Metric label="Obligé renseigné" value={`${avecOblige}/${dossierRows.length}`} /><Metric label="Retours reçus" value={retourRows.length} /></div>
    <section className="mt-8 rounded-2xl bg-blanc-casse p-5 shadow-lg"><h2 className="font-serif text-lg font-semibold text-encre">Résultat des dépôts</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(comptes).map(([s, n]) => <Metric key={s} label={label[s]} value={n} />)}</div></section>
    <section className="mt-6 grid gap-6 md:grid-cols-2"><List title="Dossiers par obligé" items={[...parOblige.entries()].sort((a,b) => b[1]-a[1])} empty="Aucun dossier." /><List title="Motifs de refus déclarés" items={[...motifs.entries()].sort((a,b) => b[1]-a[1])} empty="Aucun refus déclaré." /></section>
  </main>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-papier/50 p-4"><p className="text-xs text-ardoise">{label}</p><p className="mt-1 font-serif text-2xl font-semibold text-encre">{value}</p></div>; }
function List({ title, items, empty }: { title: string; items: [string, number][]; empty: string }) { return <section className="rounded-2xl bg-blanc-casse p-5 shadow-lg"><h2 className="font-serif text-lg font-semibold text-encre">{title}</h2>{items.length ? <ul className="mt-3 divide-y divide-filigrane">{items.map(([name,n]) => <li key={name} className="flex justify-between py-2 text-sm"><span className="text-encre">{name}</span><span className="font-mono text-ardoise">{n}</span></li>)}</ul> : <p className="mt-3 text-sm text-ardoise">{empty}</p>}</section>; }
