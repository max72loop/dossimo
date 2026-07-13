"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import type { Finding } from "@/lib/rules/types";

function assistance(finding: Finding): { action: string; texte?: string } {
  if (finding.code === "piece_mention_absente") {
    const mention = finding.detail.match(/«\s*([^»]+)\s*»/)?.[1]?.trim();
    return {
      action: "Demandez un devis ou une facture corrigée comportant cette mention avant le dépôt.",
      texte: mention,
    };
  }
  if (finding.code === "piece_mention_divergente" || finding.code === "piece_ecart" || finding.code === "piece_devis_facture") {
    return { action: "Comparez les deux valeurs avec le document d’origine, puis corrigez la saisie ou faites rééditer la pièce erronée." };
  }
  if (finding.code === "piece_illisible" || finding.code === "piece_mention_illisible") {
    return { action: "Reprenez une photo bien à plat, sans ombre et avec les quatre coins visibles, puis remplacez le document." };
  }
  if (finding.code.startsWith("chrono_")) {
    return { action: "Vérifiez les dates inscrites sur le devis et la facture. Si la saisie est fausse, corrigez-la ; si les documents sont faux, faites-les rééditer." };
  }
  if (finding.code.startsWith("rge_") || finding.code === "entreprise_siret") {
    return { action: "Vérifiez le SIRET et le certificat dans l’annuaire officiel. Corrigez la fiche entreprise si une donnée a été mal saisie." };
  }
  if (finding.code === "technique_produit") {
    return {
      action: "La désignation doit identifier précisément le produit posé sur le devis et la facture.",
      texte: "Fourniture et pose de [marque], référence [référence exacte du produit].",
    };
  }
  if (finding.code.startsWith("technique_")) {
    return { action: "Reprenez la valeur sur la fiche technique du fabricant. Ne l’estimez pas : joignez la fiche si elle n’apparaît pas clairement sur le devis." };
  }
  if (finding.code.startsWith("montants_")) {
    return { action: "Recalculez le HT, la TVA et le TTC depuis le devis. Les mêmes montants doivent apparaître dans le dossier et sur la facture." };
  }
  return { action: "Relisez la pièce indiquée et corrigez l’information avant de déposer le dossier." };
}

export function FindingAssistance({ finding }: { finding: Finding }) {
  const [copied, setCopied] = useState(false);
  if (finding.severite === "ok") return null;
  const aide = assistance(finding);

  async function copier() {
    if (!aide.texte) return;
    await navigator.clipboard.writeText(aide.texte);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-2 rounded border-l-4 border-tampon bg-info-bg px-3 py-2.5">
      <p className="text-xs font-semibold text-encre">Ce que vous devez faire</p>
      <p className="mt-0.5 text-xs leading-relaxed text-ardoise">{aide.action}</p>
      {aide.texte && (
        <div className="mt-2 flex items-start justify-between gap-3 rounded bg-blanc-casse px-3 py-2">
          <code className="text-xs leading-relaxed text-encre">{aide.texte}</code>
          <button type="button" onClick={copier} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-tampon">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}
    </div>
  );
}
