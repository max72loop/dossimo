"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  updateRegle,
  createRegle,
  type RegleActionResult,
} from "@/lib/regles/admin-actions";
import type { Dispositif } from "@/lib/database.types";

const input =
  "mt-1 h-9 w-full rounded border border-filigrane bg-blanc-casse px-2.5 text-sm text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15";
const label = "block text-xs font-medium text-ardoise";
const num = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? null : Number(v);

function Status({ res }: { res: RegleActionResult | "saving" | null }) {
  if (res === null) return null;
  if (res === "saving") return <span className="text-xs text-ardoise">Enregistrement…</span>;
  return res.ok ? (
    <span className="text-xs text-succes">Enregistré ✓</span>
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
  condition: { r_min?: number; tva_taux?: number; anciennete_min_ans?: number };
  pieces: unknown[];
  mentions: string[];
}

export function RegleEditor({ row }: { row: RegleRow }) {
  const router = useRouter();
  const [res, setRes] = useState<RegleActionResult | "saving" | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRes("saving");
    const fd = new FormData(e.currentTarget);
    const r = await updateRegle({
      id: row.id,
      r_min: num(fd.get("r_min")),
      tva_taux: num(fd.get("tva_taux")),
      anciennete_min_ans: num(fd.get("anciennete_min_ans")),
      version_formulaire: String(fd.get("version_formulaire") ?? ""),
      actif: fd.get("actif") === "on",
      pieces_json: String(fd.get("pieces_json") ?? "[]"),
      mentions_json: String(fd.get("mentions_json") ?? "[]"),
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
        <h3 className="font-mono text-sm font-semibold text-encre">
          {row.dispositif} · {row.type_travaux}{" "}
          <span className="text-encre-claire">v{row.version}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-ardoise">
          <input type="checkbox" name="actif" defaultChecked={row.actif} />
          Active
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={label}>R minimal</label>
          <input className={input} type="number" step="0.1" name="r_min" defaultValue={row.condition.r_min ?? ""} />
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
          Mentions obligatoires devis + facture (JSON) — variables {"{fiche}"} {"{surface}"} {"{r}"}
        </label>
        <textarea
          name="mentions_json"
          rows={4}
          defaultValue={JSON.stringify(row.mentions, null, 2)}
          className="mt-1 w-full rounded border border-filigrane bg-blanc-casse p-2.5 font-mono text-xs text-encre outline-none focus:border-tampon focus:ring-2 focus:ring-tampon/15"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded bg-terre-cuite px-4 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
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
      tva_taux: num(fd.get("tva_taux")),
      anciennete_min_ans: num(fd.get("anciennete_min_ans")),
      version_formulaire: String(fd.get("version_formulaire") ?? ""),
      pieces_json: String(fd.get("pieces_json") ?? "[]"),
      mentions_json: String(fd.get("mentions_json") ?? "[]"),
    });
    setRes(r);
    if (r.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded border border-filigrane bg-blanc-casse p-4">
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
          <label className={label}>R minimal</label>
          <input className={input} type="number" step="0.1" name="r_min" />
        </div>
        <div>
          <label className={label}>Taux TVA</label>
          <input className={input} type="number" step="0.001" name="tva_taux" defaultValue={0.055} />
        </div>
        <div>
          <label className={label}>Ancienneté min (ans)</label>
          <input className={input} type="number" step="1" name="anciennete_min_ans" defaultValue={2} />
        </div>
        <div className="sm:col-span-3">
          <label className={label}>Version de fiche</label>
          <input className={input} type="text" name="version_formulaire" placeholder="ex. BAR-EN-103" />
        </div>
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
