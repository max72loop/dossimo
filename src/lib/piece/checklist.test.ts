import { describe, it, expect } from "vitest";

import { checklistDossier, completude } from "@/lib/piece/checklist";
import type { DossierComplet } from "@/lib/dossier/get-dossier";
import type { PieceJustificative, TypePiece } from "@/lib/database.types";

const dossier = (dispositif: "cee" | "maprimerenov"): DossierComplet =>
  ({
    dossier: { dispositif },
    caracteristiques: {
      geste: "isolation",
      fiche: "BAR-EN-101",
      beneficiaire: {
        nom: "Martin",
        prenom: "Claire",
        code_postal: "33000",
        occupation: "proprietaire_occupant",
        precarite: "intermediaire",
      },
      travaux: {
        fiche: "BAR-EN-101",
        surface_isolee_m2: 95,
        resistance_thermique_r: 7.5,
      },
    },
    regle: null,
  }) as unknown as DossierComplet;

const piece = (type: TypePiece): PieceJustificative =>
  ({ id: type, type, deposant: "artisan" }) as PieceJustificative;

const entree = (data: DossierComplet, pieces: PieceJustificative[], id: string) =>
  checklistDossier(data, pieces).find((e) => e.id === id)!;

describe("checklist reliée aux pièces réelles", () => {
  const cee = dossier("cee");

  it("coche une entrée dès que sa pièce est déposée", () => {
    const e = entree(cee, [piece("fiche_technique")], "fiche_technique");
    expect(e.deposee).toBe(true);
    expect(e.manquants).toEqual([]);
  });

  it("laisse vide une entrée dont la pièce manque", () => {
    const e = entree(cee, [], "qualification_rge");
    expect(e.deposee).toBe(false);
    expect(e.manquants).toEqual(["qualification_rge"]);
  });

  it("le devis signé est satisfait par la pièce « devis »", () => {
    // L'identifiant de checklist (`devis_signe`) et le type de pièce (`devis`) ne
    // coïncident pas : c'est l'une des deux exceptions que le liant porte.
    expect(entree(cee, [piece("devis")], "devis_signe").deposee).toBe(true);
  });

  it("les photos exigent l'avant ET l'après", () => {
    // Une seule photo ne prouve rien : la case ne se coche pas à moitié.
    const seule = entree(cee, [piece("photo_avant")], "photos");
    expect(seule.deposee).toBe(false);
    expect(seule.manquants).toEqual(["photo_apres"]);

    const deux = entree(cee, [piece("photo_avant"), piece("photo_apres")], "photos");
    expect(deux.deposee).toBe(true);
  });

  it("distingue ce qui incombe à l'artisan de ce qui incombe au client", () => {
    const mpr = dossier("maprimerenov");
    expect(entree(mpr, [], "fiche_technique").fournisseur).toBe("artisan");
    expect(entree(mpr, [], "avis_imposition").fournisseur).toBe("beneficiaire");
    expect(entree(mpr, [], "rib").fournisseur).toBe("beneficiaire");
  });

  it("compte la complétude sur les seules pièces obligatoires", () => {
    const avant = completude(checklistDossier(cee, []));
    expect(avant.reunies).toBe(0);
    expect(avant.total).toBeGreaterThan(0);

    const apres = completude(
      checklistDossier(cee, [piece("devis"), piece("facture")]),
    );
    expect(apres.reunies).toBe(2);
    expect(apres.total).toBe(avant.total);
  });

  it("une pièce rejetée ne coche pas sa case et ne compte pas dans la complétude", () => {
    // Le rejet n'avait aucun effet : le dossier s'affichait comme réuni sur une
    // pièce que l'artisan venait justement de refuser.
    const rejetee = { ...piece("avis_imposition"), validation_status: "rejected" as const };
    const mpr = dossier("maprimerenov");
    const e = entree(mpr, [rejetee], "avis_imposition");
    expect(e.deposee).toBe(false);
    expect(e.manquants).toEqual(["avis_imposition"]);

    const avec = completude(checklistDossier(cee, [piece("devis"), piece("facture")]));
    const apresRejet = completude(
      checklistDossier(cee, [
        piece("devis"),
        { ...piece("facture"), validation_status: "rejected" as const },
      ]),
    );
    expect(apresRejet.reunies).toBe(avec.reunies - 1);
  });

  it("une pièce soumise ou validée coche sa case", () => {
    // La case dit « c'est arrivé », pas « c'est validé » : seul le rejet la décoche.
    for (const statut of ["submitted", "approved", null] as const) {
      const e = entree(cee, [{ ...piece("devis"), validation_status: statut }], "devis_signe");
      expect(e.deposee, `statut ${statut}`).toBe(true);
    }
  });

  it("une pièce du bénéficiaire coche bien sa case (MaPrimeRénov')", () => {
    const mpr = dossier("maprimerenov");
    const e = entree(mpr, [piece("avis_imposition")], "avis_imposition");
    expect(e.deposee).toBe(true);
  });
});
