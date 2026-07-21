"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import {
  updateRegle,
  createRegle,
  type RegleActionResult,
} from "@/lib/regles/admin-actions";
import type { Dispositif } from "@/lib/database.types";
import { FAMILLES, familleDeGeste, type Famille } from "@/lib/dossier/cee-isolation";

/**
 * Seuil technique édité selon la famille de geste : chaque geste a UN critère
 * principal (R pour l'isolation, ETAS pour la PAC, COP pour le CET, rendement
 * pour le bois, efficacité ECS pour le solaire). Piloté par la table, jamais
 * codé en dur dans le contrôle.
 *
 * Le CESI a un second critère de fiche, la surface de capteurs
 * (`surface_capteurs_min`) : il s'édite dans le JSON de condition, comme tout
 * seuil secondaire. `fusionnerCondition` le préserve.
 */
const SEUIL_PAR_FAMILLE: Record<
  Famille,
  {
    name: "r_min" | "etas_min" | "cop_min" | "rendement_min" | "efficacite_ecs_min";
    label: string;
    step: string;
  }
> = {
  isolation: { name: "r_min", label: "R minimal (m²·K/W)", step: "0.1" },
  pac_air_eau: { name: "etas_min", label: "ETAS minimal (%)", step: "1" },
  cet: { name: "cop_min", label: "COP minimal", step: "0.1" },
  bois: { name: "rendement_min", label: "Rendement minimal (%)", step: "0.1" },
  solaire_thermique: {
    name: "efficacite_ecs_min",
    label: "Efficacité ECS minimale (%)",
    step: "0.1",
  },
};

/** Indication de barème (mode + gabarit JSON) selon la famille de geste. */
function gabaritPrime(famille: Famille): { hint: string; exemple: string } {
  if (famille === "isolation") {
    return {
      hint: "{ par_m2: { classique, precaire, grande_precarite }, plafond }",
      exemple: '{ "par_m2": { "classique": 10, "precaire": 15, "grande_precarite": 20 } }',
    };
  }
  return {
    hint: "{ forfait: { classique, precaire, grande_precarite } }",
    exemple: '{ "forfait": { "classique": 2500, "precaire": 3500, "grande_precarite": 4500 } }',
  };
}

const input =
  "mt-1 h-9 w-full rounded border border-filigrane bg-blanc-casse px-2.5 text-sm text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15";
const label = "block text-xs font-medium text-ardoise";
const num = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? null : Number(v);

function Status({ res }: { res: RegleActionResult | "saving" | null }) {
  if (res === null) return null;
  if (res === "saving") return <span className="text-xs text-ardoise">Enregistrement…</span>;
  return res.ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-succes">Enregistré<Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /></span>
  ) : (
    <span className="text-xs text-erreur">{res.error}</span>
  );
}

export interface RegleRow {
  id: string;
  dispositif: Dispositif;
  type_travaux: string;
  version: number;
  actif: boolean;
  version_formulaire: string | null;
  condition: {
    r_min?: number;
    etas_min?: number;
    cop_min?: number;
    rendement_min?: number;
    efficacite_ecs_min?: number;
    surface_capteurs_min?: number;
    tva_taux?: number;
    anciennete_min_ans?: number;
    prime?: unknown;
  };
  pieces: unknown[];
  mentions: string[];
}

export function RegleEditor({ row }: { row: RegleRow }) {
  const router = useRouter();
  const [res, setRes] = useState<RegleActionResult | "saving" | null>(null);
  const famille = familleDeGeste(row.type_travaux);
  const seuil = SEUIL_PAR_FAMILLE[famille];
  const prime = gabaritPrime(famille);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRes("saving");
    const fd = new FormData(e.currentTarget);
    // Seul le seuil du geste est présent dans le formulaire ; les autres partent
    // à null (retirés au merge), ce qui nettoie d'éventuelles clés parasites.
    //
    // `surface_capteurs_min` est volontairement ABSENT de cette liste : c'est un
    // seuil secondaire que ce formulaire n'expose pas, donc `fd.get` renverrait
    // toujours null et l'effacerait à chaque enregistrement. Ne pas le passer le
    // laisse inchangé (`undefined` = intouché dans `fusionnerCondition`).
    const r = await updateRegle({
      id: row.id,
      r_min: num(fd.get("r_min")),
      etas_min: num(fd.get("etas_min")),
      cop_min: num(fd.get("cop_min")),
      rendement_min: num(fd.get("rendement_min")),
      efficacite_ecs_min: num(fd.get("efficacite_ecs_min")),
      tva_taux: num(fd.get("tva_taux")),
      anciennete_min_ans: num(fd.get("anciennete_min_ans")),
      version_formulaire: String(fd.get("version_formulaire") ?? ""),
      actif: fd.get("actif") === "on",
      pieces_json: String(fd.get("pieces_json") ?? "[]"),
      mentions_json: String(fd.get("mentions_json") ?? "[]"),
      prime_json: String(fd.get("prime_json") ?? "{}"),
    });
    setRes(r);
    if (r.ok) router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded border p-4 ${row.actif ? "border-filigrane bg-blanc-casse" : "border-dashed border-filigrane bg-papier/40"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm font-semibold text-encre">
            {row.dispositif} · {row.type_travaux}{" "}
            <span className="text-encre-claire">v{row.version}</span>
          </h3>
          <span className="text-xs text-tampon">{FAMILLES[famille]}</span>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-ardoise">
          <input type="checkbox" name="actif" defaultChecked={row.actif} />
          Active
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={label}>{seuil.label}</label>
          <input
            className={input}
            type="number"
            step={seuil.step}
            name={seuil.name}
            defaultValue={row.condition[seuil.name] ?? ""}
          />
        </div>
        <div>
          <label className={label}>Taux TVA (ex. 0.055)</label>
          <input className={input} type="number" step="0.001" name="tva_taux" defaultValue={row.condition.tva_taux ?? ""} />
        </div>
        <div>
          <label className={label}>Ancienneté min (ans)</label>
          <input className={input} type="number" step="1" name="anciennete_min_ans" defaultValue={row.condition.anciennete_min_ans ?? ""} />
        </div>
        <div>
          <label className={label}>Version de fiche</label>
          <input className={input} type="text" name="version_formulaire" defaultValue={row.version_formulaire ?? ""} />
        </div>
      </div>

      <div className="mt-3">
        <label className={label}>Pièces requises (JSON)</label>
        <textarea
          name="pieces_json"
          rows={6}
          defaultValue={JSON.stringify(row.pieces, null, 2)}
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>

      <div className="mt-3">
        <label className={label}>
          Mentions obligatoires devis + facture (JSON)
          {famille === "isolation"
            ? " · variables {fiche} {surface} {r}"
            : famille === "solaire_thermique"
              ? " · variables {fiche} {appoint} {fluide} {surface} {soutirage} {efficacite} {ballons} {volume} {classe}"
              : " · variables {fiche}"}
        </label>
        <textarea
          name="mentions_json"
          rows={4}
          defaultValue={JSON.stringify(row.mentions, null, 2)}
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>

      <div className="mt-3">
        <label className={label}>Barème prime (JSON) · {prime.hint}</label>
        <textarea
          name="prime_json"
          rows={3}
          defaultValue={JSON.stringify(row.condition.prime ?? {}, null, 2)}
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded bg-accent px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-accent-hover"
        >
          Enregistrer
        </button>
        <Status res={res} />
      </div>
    </form>
  );
}

export function RegleCreator() {
  const router = useRouter();
  const [res, setRes] = useState<RegleActionResult | "saving" | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRes("saving");
    const fd = new FormData(e.currentTarget);
    const r = await createRegle({
      dispositif: String(fd.get("dispositif")) as Dispositif,
      type_travaux: String(fd.get("type_travaux") ?? ""),
      version: Number(fd.get("version") ?? 1),
      r_min: num(fd.get("r_min")),
      etas_min: num(fd.get("etas_min")),
      cop_min: num(fd.get("cop_min")),
      rendement_min: num(fd.get("rendement_min")),
      efficacite_ecs_min: num(fd.get("efficacite_ecs_min")),
      surface_capteurs_min: num(fd.get("surface_capteurs_min")),
      tva_taux: num(fd.get("tva_taux")),
      anciennete_min_ans: num(fd.get("anciennete_min_ans")),
      version_formulaire: String(fd.get("version_formulaire") ?? ""),
      pieces_json: String(fd.get("pieces_json") ?? "[]"),
      mentions_json: String(fd.get("mentions_json") ?? "[]"),
      prime_json: String(fd.get("prime_json") ?? "{}"),
    });
    setRes(r);
    if (r.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-blanc-casse p-4 shadow-lg">
      <h3 className="font-serif text-sm font-semibold text-encre">Nouveau couple / version</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className={label}>Dispositif</label>
          <select name="dispositif" className={input} defaultValue="cee">
            <option value="cee">cee</option>
            <option value="maprimerenov">maprimerenov</option>
          </select>
        </div>
        <div>
          <label className={label}>Type de travaux</label>
          <input className={input} type="text" name="type_travaux" placeholder="ex. plancher_bas" />
        </div>
        <div>
          <label className={label}>Version</label>
          <input className={input} type="number" step="1" name="version" defaultValue={1} />
        </div>
        <div>
          <label className={label}>Taux TVA</label>
          <input className={input} type="number" step="0.001" name="tva_taux" defaultValue={0.055} />
        </div>
        <div>
          <label className={label}>Ancienneté min (ans)</label>
          <input className={input} type="number" step="1" name="anciennete_min_ans" defaultValue={2} />
        </div>
      </div>

      <p className="mt-3 text-xs text-ardoise">
        Seuil technique · renseignez celui du geste : R (isolation), ETAS (PAC),
        COP (chauffe-eau thermo), rendement (bois), efficacité ECS (solaire).
      </p>
      <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={label}>R min (isolation)</label>
          <input className={input} type="number" step="0.1" name="r_min" />
        </div>
        <div>
          <label className={label}>ETAS min (PAC)</label>
          <input className={input} type="number" step="1" name="etas_min" />
        </div>
        <div>
          <label className={label}>COP min (CET)</label>
          <input className={input} type="number" step="0.1" name="cop_min" />
        </div>
        <div>
          <label className={label}>Rendement min (bois)</label>
          <input className={input} type="number" step="0.1" name="rendement_min" />
        </div>
        <div>
          <label className={label}>Efficacité ECS min (solaire)</label>
          <input className={input} type="number" step="0.1" name="efficacite_ecs_min" />
        </div>
        <div>
          <label className={label}>Surface capteurs min (solaire, m²)</label>
          <input className={input} type="number" step="0.1" name="surface_capteurs_min" />
        </div>
      </div>

      <div className="mt-3">
        <label className={label}>Version de fiche</label>
        <input className={input} type="text" name="version_formulaire" placeholder="ex. BAR-TH-171 vA78.4" />
      </div>
      <div className="mt-3">
        <label className={label}>Pièces requises (JSON)</label>
        <textarea
          name="pieces_json"
          rows={4}
          defaultValue="[]"
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>
      <div className="mt-3">
        <label className={label}>Mentions obligatoires (JSON)</label>
        <textarea
          name="mentions_json"
          rows={3}
          defaultValue="[]"
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>
      <div className="mt-3">
        <label className={label}>
          Barème prime (JSON) · isolation {"{ par_m2: {…} }"} · chauffage {"{ forfait: {…} }"}
        </label>
        <textarea
          name="prime_json"
          rows={2}
          defaultValue="{}"
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded border border-encre bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier"
        >
          Créer
        </button>
        <Status res={res} />
      </div>
    </form>
  );
}
