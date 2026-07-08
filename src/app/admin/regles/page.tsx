import { notFound } from "next/navigation";
import Link from "next/link";

import { getAdminEmail } from "@/lib/auth/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RegleEditor,
  RegleCreator,
  type RegleRow,
} from "@/components/admin/regle-editor";
import type { Dispositif } from "@/lib/database.types";

export const metadata = { title: "Règles métier · Admin Dossimo" };

export default async function AdminReglesPage() {
  const admin = await getAdminEmail();
  if (!admin) notFound();

  // Lecture de TOUTES les règles (y compris inactives) via service-role : la RLS
  // publique ne montre que les règles actives. L'accès est déjà restreint admin.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("regles_metier")
    .select("id, dispositif, type_travaux, version, actif, version_formulaire, condition_json, pieces_requises_json, points_vigilance_json")
    .order("dispositif")
    .order("type_travaux")
    .order("version", { ascending: false });

  const rows: RegleRow[] = (data ?? []).map((r) => ({
    id: r.id,
    dispositif: r.dispositif as Dispositif,
    type_travaux: r.type_travaux,
    version: r.version,
    actif: r.actif,
    version_formulaire: r.version_formulaire,
    condition: (r.condition_json ?? {}) as RegleRow["condition"],
    pieces: Array.isArray(r.pieces_requises_json)
      ? (r.pieces_requises_json as unknown[])
      : [],
    mentions: Array.isArray(r.points_vigilance_json)
      ? (r.points_vigilance_json as string[])
      : [],
  }));

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <Link
        href="/dossiers"
        className="text-sm text-tampon underline-offset-4 transition hover:underline"
      >
        ← Mes dossiers
      </Link>

      <div className="mt-4 mb-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-encre">
          Règles métier
        </h1>
        <p className="mt-2 text-sm text-ardoise">
          Paramètres par couple dispositif + travaux (seuils, TVA, ancienneté,
          pièces, version de fiche). Modifiables ici, sans redéploiement · le
          contrôle anti-refus et le pack les lisent en direct.
        </p>
        <p className="mt-1 text-xs text-encre-claire">Connecté en admin : {admin}</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-filigrane bg-papier/40 px-4 py-6 text-sm text-ardoise">
          Aucune règle enregistrée. Le contrôle utilise ses valeurs codées par
          défaut. Créez une règle ci-dessous pour la piloter depuis la base.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <RegleEditor key={row.id} row={row} />
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-filigrane pt-6">
        <RegleCreator />
      </div>
    </main>
  );
}
