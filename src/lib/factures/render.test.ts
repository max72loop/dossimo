import { describe, it, expect } from "vitest";

import { renderFacturePdf } from "@/lib/factures/render";
import { editeur, mentionsIncompletes } from "@/lib/legal/editeur";
import type { FactureComplete } from "@/lib/factures/get-facture";
import type { Facture } from "@/lib/database.types";

/**
 * La facture est un document fiscal : elle ne doit jamais sortir avec un
 * placeholder, ni avec une mention qui ne s'applique pas à l'entité (RCS, TVA
 * intracommunautaire d'une EI en franchise en base).
 */
function facture(): FactureComplete {
  return {
    facture: {
      id: "f1",
      numero: "FA-2026-00001",
      annee: 2026,
      rang: 1,
      paiement_id: "p1",
      artisan_id: "a1",
      dossier_id: "d1",
      emise_le: "2026-07-10T09:00:00Z",
      acheteur_json: null,
      lignes_json: null,
      total_ht_cents: 14900,
      tva_taux: 0,
      total_tva_cents: 0,
      total_ttc_cents: 14900,
      mention_tva: "TVA non applicable, art. 293 B du CGI",
    } as unknown as Facture,
    acheteur: {
      entreprise: "Isolation du Nord",
      nom: "Durand",
      prenom: "Claire",
      email: "claire@isolation-nord.fr",
      siret: "12345678900011",
      adresse: "5 rue des Lilas",
      code_postal: "75011",
      ville: "Paris",
    },
    lignes: [
      {
        designation: "Pack Dossimo, dossier Claire Durand",
        detail: "Contrôle anti-refus et pack documentaire (BAR-EN-101).",
        quantite: 1,
        pu_ht_cents: 14900,
        total_ht_cents: 14900,
      },
    ],
  };
}

describe("identité de l'éditeur", () => {
  it("est complète : la route PDF ne bloque plus le téléchargement", () => {
    expect(mentionsIncompletes()).toBe(false);
  });

  it("n'invente ni RCS ni n° de TVA intracommunautaire", () => {
    expect(editeur.rcs).toBeNull();
    expect(editeur.tvaIntracom).toBeNull();
  });
});

describe("rendu de la facture", () => {
  it("produit un PDF non vide", async () => {
    const pdf = await renderFacturePdf(facture());
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("n'imprime aucun placeholder d'identité", async () => {
    const pdf = await renderFacturePdf(facture());
    // Les métadonnées du document (titre, auteur) sont en clair dans le PDF ;
    // le corps est compressé, d'où le contrôle en amont sur `editeur`.
    expect(pdf.toString("latin1")).not.toContain("COMPLÉTER");
    for (const champ of [
      editeur.raisonSociale,
      editeur.siret,
      editeur.adresse,
      editeur.directeurPublication,
    ]) {
      expect(champ).not.toContain("COMPLÉTER");
    }
  });
});
