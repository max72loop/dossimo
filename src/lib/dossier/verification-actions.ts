"use server";

import { familleDeGeste } from "@/lib/dossier/cee-isolation";
import { verifierEntreprise } from "@/lib/verification/verifier";
import type { VerificationEntreprise } from "@/lib/verification/types";

export type VerifierSiretResult =
  | { ok: true; verification: VerificationEntreprise }
  | { ok: false; error: string };

/**
 * Vérifie à la volée un SIRET + sa qualification RGE, depuis le formulaire de
 * saisie. Sert à préremplir la raison sociale et les infos RGE réelles (le
 * fictif devient impossible à saisir). Le contrôle FAISANT AUTORITÉ est refait
 * côté serveur à la création du dossier (`createDossierCeeIsolation`) : ce
 * bouton ne peut donc pas être contourné en le zappant.
 */
export async function verifierSiretRge(input: {
  siret: string;
  geste: string;
  dateDevis?: string | null;
}): Promise<VerifierSiretResult> {
  const siret = (input.siret ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(siret)) {
    return { ok: false, error: "Le SIRET doit comporter 14 chiffres." };
  }

  const verification = await verifierEntreprise({
    siret,
    famille: familleDeGeste(input.geste || "isolation"),
    dateDevis: input.dateDevis || null,
  });

  return { ok: true, verification };
}
