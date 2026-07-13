import Link from "next/link";
import { QuoteLibrary } from "@/components/quotes/quote-library";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Devis conformes · Dossimo" };

export default async function DevisPage() {
  const supabase = await createClient();
  const { data: gestures } = await supabase.from("quote_gestures").select("id,label,category,mpr_eligible,cee_eligible,cee_fiche_reference").eq("active", true).order("label");
  const { data: fields } = await supabase.from("quote_gesture_fields").select("gesture_id,key,label,type,unit,required,help_text").order("position");
  return <main className="mx-auto max-w-5xl px-8 py-10"><Link href="/dossiers" className="text-sm text-tampon underline-offset-4 hover:underline">← Mes dossiers</Link><h1 className="mt-4 font-serif text-3xl font-semibold text-encre">Bibliothèque de devis</h1><p className="mt-2 max-w-2xl text-sm text-ardoise">Générez un bloc de lignes à intégrer à votre devis : désignation, caractéristiques, référence CEE et mentions RGE.</p><div className="mt-8"><QuoteLibrary gestures={gestures ?? []} fields={fields ?? []} /></div></main>;
}
