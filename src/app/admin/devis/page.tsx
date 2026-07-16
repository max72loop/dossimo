import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteTemplateEditor } from "@/components/quotes/quote-template-editor";
import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
export const metadata = { title: "Modèles de devis · Admin"};
export default async function AdminDevisPage() {
  if (!(await getAdminEmail())) notFound();
  const admin = createAdminClient();
  const { data: gestures } = await admin.from("quote_gestures").select("id,label").eq("active", true).order("label");
  const { data: templates } = await admin.from("quote_templates").select("id,gesture_id,version,valid_from,valid_until,placeholder,source_url,reviewed_at").order("created_at", { ascending: false }).limit(20);
  const labels = new Map((gestures ?? []).map((g) => [g.id, g.label]));
  return <main className="mx-auto max-w-4xl px-8 py-10"><Link href="/admin/regles" className="text-sm text-tampon underline-offset-4 hover:underline">← Règles métier</Link><h1 className="mt-4 font-serif text-3xl font-semibold text-encre">Modèles de devis</h1><p className="mt-2 text-sm text-ardoise">Source, période d’effet et revue sont enregistrées avec chaque version.</p><div className="mt-8"><QuoteTemplateEditor gestures={gestures ?? []} /></div><section className="mt-8 rounded border border-filigrane bg-papier/40 p-5"><h2 className="font-serif text-lg font-semibold text-encre">Dernières versions</h2><ul className="mt-3 divide-y divide-filigrane">{(templates ?? []).map((t) => <li key={t.id} className="py-3 text-sm"><span className="font-medium text-encre">{labels.get(t.gesture_id) ?? "Geste"} · v{t.version}</span><span className="ml-2 text-ardoise">à partir du {t.valid_from}</span><span className={`ml-2 text-xs ${t.placeholder ? "text-avertissement" : "text-succes"}`}>{t.placeholder ? "à valider" : "validé"}</span>{t.source_url && <a className="ml-2 text-tampon underline" href={t.source_url} target="_blank" rel="noreferrer">source</a>}</li>)}</ul></section></main>;
}
