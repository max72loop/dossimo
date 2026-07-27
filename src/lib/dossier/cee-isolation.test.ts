import { describe, expect, it } from "vitest";

import {
  ceeIsolationDefaults,
  ceeIsolationSchema,
  type CeeIsolationInput,
} from "@/lib/dossier/cee-isolation";

/**
 * Le cadre A de l'attestation sur l'honneur d'une PAC air/eau n'est pas laissé à
 * l'appréciation de l'obligé : l'annexe 1 de la fiche BAR-TH-171 (vA78.4) en
 * définit le contenu champ par champ, astérisque comprise. Un champ obligatoire
 * absent de la saisie, c'est une case que l'artisan remplit de tête devant son
 * AH, donc un écart possible avec le devis et la facture (CHANGELOG-cerfa.md).
 *
 * D'où un cas conforme et un cas de refus par champ marqué d'un astérisque.
 */
function dossierPacValide(): CeeIsolationInput {
  return {
    ...ceeIsolationDefaults,
    dispositif: "cee",
    geste: "pac_air_eau",
    entreprise: "Chauffage du Val",
    siret: "12345678901234",
    rge_numero: "QB/12345",
    rge_domaine: "Pompes à chaleur",
    rge_date_fin: "2027-01-31",
    signataire_nom: "Martin",
    signataire_prenom: "Claude",
    email: "contact@chauffageduval.fr",
    client_nom: "Durand",
    client_prenom: "Sophie",
    client_adresse: "12 rue des Tilleuls",
    client_code_postal: "08600",
    client_commune: "Givet",
    occupation: "proprietaire_occupant",
    precarite: "precaire",
    logement_type: "maison",
    logement_annee_construction: "1985",
    logement_residence: "principale",
    // Bloc PAC complet, cadre A compris.
    pac_etas: "126",
    pac_puissance_kw: "8",
    pac_temperature: "basse",
    pac_marque: "Atlantic",
    pac_reference: "Alfea Excellia",
    pac_regulateur_classe: "VI",
    pac_surface_chauffee_m2: "95",
    pac_usage: "chauffage",
    pac_systeme_deporte: "non",
    pac_reference_modele: "EPREL-123456",
    pac_regulateur: "oui",
    pac_note_dimensionnement: "oui",
    // Question posée quel que soit le geste (cadre A des six fiches).
    sous_traitance: "non",
    date_devis: "2026-05-04",
    montant_ht: "10000",
    montant_ttc: "10550",
  } as CeeIsolationInput;
}

/**
 * Champ laissé vide. On retire la clé plutôt que d'y mettre `""` : un champ que
 * le formulaire n'affiche pas n'est jamais soumis, et c'est bien `requisSi` que
 * l'on veut éprouver ici, pas le parseur d'enum.
 */
function sansChamp(champ: keyof CeeIsolationInput): CeeIsolationInput {
  return { ...dossierPacValide(), [champ]: undefined } as CeeIsolationInput;
}

function erreursSur(input: CeeIsolationInput): string[] {
  const res = ceeIsolationSchema.safeParse(input);
  if (res.success) return [];
  return res.error.issues.map((i) => String(i.path[0]));
}

describe("saisie PAC air/eau — cadre A de l'attestation sur l'honneur", () => {
  it("accepte un dossier PAC dont le cadre A est complet", () => {
    expect(erreursSur(dossierPacValide())).toEqual([]);
  });

  it("refuse un dossier sans surface chauffée par la PAC", () => {
    expect(erreursSur(sansChamp("pac_surface_chauffee_m2"))).toContain(
      "pac_surface_chauffee_m2",
    );
  });

  it("refuse un dossier sans usage couvert par la PAC", () => {
    expect(erreursSur(sansChamp("pac_usage"))).toContain("pac_usage");
  });

  it("refuse un dossier qui ne dit pas s'il y a un système déporté", () => {
    expect(erreursSur(sansChamp("pac_systeme_deporte"))).toContain(
      "pac_systeme_deporte",
    );
  });

  it("exige la marque du système déporté seulement quand il y en a un", () => {
    const avec = {
      ...dossierPacValide(),
      pac_systeme_deporte: "oui",
      pac_deporte_marque: "",
    } as CeeIsolationInput;
    expect(erreursSur(avec)).toContain("pac_deporte_marque");

    // Réciproque : sans système déporté, la marque n'a pas à être réclamée.
    expect(erreursSur(dossierPacValide())).not.toContain("pac_deporte_marque");
  });

  it("n'impose pas la référence de facture, non marquée d'un astérisque", () => {
    // Elle figure bien au cadre A, mais l'annexe 1 ne la rend pas obligatoire :
    // la réclamer bloquerait un dossier que l'obligé accepterait.
    expect(erreursSur(sansChamp("facture_reference"))).toEqual([]);
  });

  it("ne réclame le cadre A d'une PAC que pour le geste PAC", () => {

    // Un dossier isolation ne doit pas hériter des champs d'un autre geste.
    const isolation = {
      ...dossierPacValide(),
      geste: "isolation",
      type_isolation: "combles_perdus",
      surface_isolee_m2: "70",
      isolant_type: "laine de verre",
      isolant_marque: "Isover",
      resistance_thermique_r: "7",
      pac_surface_chauffee_m2: undefined,
      pac_usage: undefined,
      pac_systeme_deporte: undefined,
      pac_reference_modele: undefined,
      pac_regulateur: undefined,
      pac_note_dimensionnement: undefined,
    } as unknown as CeeIsolationInput;

    const erreurs = erreursSur(isolation);
    expect(erreurs).not.toContain("pac_surface_chauffee_m2");
    expect(erreurs).not.toContain("pac_usage");
    expect(erreurs).not.toContain("pac_systeme_deporte");
  });
});

/**
 * Le bloc sous-traitant figure au cadre A des SIX fiches, à astérisque. La
 * question se pose donc pour tous les gestes, et ne se devine pas : une
 * sous-traitance non déclarée est un motif de refus.
 */
describe("sous-traitance — cadre A commun aux six fiches", () => {
  it("refuse un dossier qui ne répond pas à la question", () => {
    expect(erreursSur(sansChamp("sous_traitance"))).toContain("sous_traitance");
  });

  it("accepte « non » sans réclamer la moindre identité", () => {
    const erreurs = erreursSur(dossierPacValide());
    expect(erreurs).toEqual([]);
  });

  it("exige les quatre champs du cadre A quand la réponse est « oui »", () => {
    const oui = { ...dossierPacValide(), sous_traitance: "oui" } as CeeIsolationInput;
    const erreurs = erreursSur(oui);
    expect(erreurs).toContain("sous_traitant_nom");
    expect(erreurs).toContain("sous_traitant_prenom");
    expect(erreurs).toContain("sous_traitant_raison_sociale");
    expect(erreurs).toContain("sous_traitant_siret");
  });

  it("refuse un SIRET de sous-traitant mal formé", () => {
    const oui = {
      ...dossierPacValide(),
      sous_traitance: "oui",
      sous_traitant_nom: "Bernard",
      sous_traitant_prenom: "Luc",
      sous_traitant_raison_sociale: "Toiture Ardennes",
      sous_traitant_siret: "123",
    } as CeeIsolationInput;
    expect(erreursSur(oui)).toContain("sous_traitant_siret");
  });

  it("refuse le SIRET du signataire : ce n'en est pas un sous-traitant", () => {
    // Le cadre n'existe QUE pour le cas « ce n'est pas le signataire » ; laisser
    // passer le même SIRET produirait une déclaration qui se contredit.
    const oui = {
      ...dossierPacValide(),
      sous_traitance: "oui",
      sous_traitant_nom: "Martin",
      sous_traitant_prenom: "Claude",
      sous_traitant_raison_sociale: "Chauffage du Val",
      sous_traitant_siret: "12345678901234",
    } as CeeIsolationInput;
    expect(erreursSur(oui)).toContain("sous_traitant_siret");
  });

  it("accepte une sous-traitance complète et distincte", () => {
    const oui = {
      ...dossierPacValide(),
      sous_traitance: "oui",
      sous_traitant_nom: "Bernard",
      sous_traitant_prenom: "Luc",
      sous_traitant_raison_sociale: "Toiture Ardennes",
      sous_traitant_siret: "98765432109876",
    } as CeeIsolationInput;
    expect(erreursSur(oui)).toEqual([]);
  });
});

/**
 * Cases Oui / Non du cadre A propres à un geste. Deux à astérisque pour le CESI,
 * une sans astérisque pour l'isolation — et cette dernière ne concerne pas les
 * murs, dont la fiche (BAR-EN-102) ne la pose pas.
 */
function dossierSolaireValide(): CeeIsolationInput {
  return {
    ...dossierPacValide(),
    geste: "solaire_thermique",
    rge_domaine: "Chauffe-eau solaire",
    solaire_appoint: "electrique_joule",
    solaire_fluide: "eau_glycolee",
    solaire_surface_capteurs_m2: "4",
    solaire_profil_soutirage: "L",
    solaire_efficacite_ecs: "95",
    solaire_nb_ballons: "1",
    solaire_volume_ballon_l: "300",
    solaire_classe_ballon: "B",
    solaire_certification: "cstbat",
    solaire_couvre_totalite_ecs: "oui",
    solaire_capteurs_non_hybrides: "oui",
    solaire_marque: "Atlantic",
    // Champs PAC neutralisés : un dossier ne porte qu'un bloc technique.
    pac_surface_chauffee_m2: undefined,
    pac_usage: undefined,
    pac_systeme_deporte: undefined,
  } as unknown as CeeIsolationInput;
}

describe("cadre A du chauffe-eau solaire (BAR-TH-101)", () => {
  it("accepte un CESI dont les deux cases sont renseignées", () => {
    expect(erreursSur(dossierSolaireValide())).toEqual([]);
  });

  it("refuse un CESI qui ne dit pas s'il couvre la totalité du besoin ECS", () => {
    const sans = {
      ...dossierSolaireValide(),
      solaire_couvre_totalite_ecs: undefined,
    } as CeeIsolationInput;
    expect(erreursSur(sans)).toContain("solaire_couvre_totalite_ecs");
  });

  it("refuse un CESI qui ne dit pas si les capteurs sont non hybrides", () => {
    const sans = {
      ...dossierSolaireValide(),
      solaire_capteurs_non_hybrides: undefined,
    } as CeeIsolationInput;
    expect(erreursSur(sans)).toContain("solaire_capteurs_non_hybrides");
  });
});

describe("pare-vapeur (BAR-EN-101 / 103, sans astérisque)", () => {
  function dossierIsolationValide(): CeeIsolationInput {
    return {
      ...dossierPacValide(),
      geste: "isolation",
      type_isolation: "combles_perdus",
      surface_isolee_m2: "70",
      isolant_type: "laine de verre",
      isolant_marque: "Isover",
      resistance_thermique_r: "7",
      pac_surface_chauffee_m2: undefined,
      pac_usage: undefined,
      pac_systeme_deporte: undefined,
      pac_reference_modele: undefined,
      pac_regulateur: undefined,
      pac_note_dimensionnement: undefined,
    } as unknown as CeeIsolationInput;
  }

  it("n'est pas obligatoire : l'annexe ne le marque pas d'un astérisque", () => {
    expect(erreursSur(dossierIsolationValide())).toEqual([]);
  });

  it("est accepté quand il est renseigné", () => {
    const avec = {
      ...dossierIsolationValide(),
      isolation_pare_vapeur: "oui",
    } as CeeIsolationInput;
    expect(erreursSur(avec)).toEqual([]);
  });
});

/**
 * Référence du modèle au registre EPREL. Obligation EN VIGUEUR depuis la
 * vA78.4 (01/01/2026), pas une échéance de septembre : le texte officiel ne dit
 * jamais « EPREL » mais « le numéro du modèle au sens du règlement (UE)
 * 2017/1369 », ce qui désigne le même identifiant (CHANGELOG-cerfa.md).
 */
describe("référence du modèle EPREL (BAR-TH-171)", () => {
  it("refuse une PAC sans référence de modèle", () => {
    expect(erreursSur(sansChamp("pac_reference_modele"))).toContain(
      "pac_reference_modele",
    );
  });

  it("n'exige pas le numéro d'agrément : réservé aux PAC bonifiées", () => {
    expect(erreursSur(sansChamp("pac_numero_agrement"))).toEqual([]);
  });
});

/**
 * Trois cases à astérisque du cadre A de la PAC, restées hors de la saisie
 * jusqu'à la relecture systématique du 26/07 : la présence du régulateur (sa
 * classe seule ne suffit pas), la remise de la note de dimensionnement, et la
 * consommation d'énergie du système déporté.
 */
describe("cadre A de la PAC — régulateur, dimensionnement, déporté", () => {
  it("refuse une PAC qui ne dit pas si elle a un régulateur", () => {
    expect(erreursSur(sansChamp("pac_regulateur"))).toContain("pac_regulateur");
  });

  it("exige la classe du régulateur seulement s'il y en a un", () => {
    const avec = {
      ...dossierPacValide(),
      pac_regulateur: "oui",
      pac_regulateur_classe: "",
    } as CeeIsolationInput;
    expect(erreursSur(avec)).toContain("pac_regulateur_classe");

    const sans = {
      ...dossierPacValide(),
      pac_regulateur: "non",
      pac_regulateur_classe: "",
    } as CeeIsolationInput;
    expect(erreursSur(sans)).not.toContain("pac_regulateur_classe");
  });

  it("refuse une PAC qui ne déclare pas la note de dimensionnement", () => {
    expect(erreursSur(sansChamp("pac_note_dimensionnement"))).toContain(
      "pac_note_dimensionnement",
    );
  });

  it("n'interroge la consommation du déporté que s'il y a un déporté", () => {
    // Sans déporté : la question est sans objet.
    expect(erreursSur(dossierPacValide())).not.toContain(
      "pac_deporte_consomme_energie",
    );

    const avec = {
      ...dossierPacValide(),
      pac_systeme_deporte: "oui",
      pac_deporte_marque: "Atlantic",
    } as CeeIsolationInput;
    expect(erreursSur(avec)).toContain("pac_deporte_consomme_energie");
  });
});
