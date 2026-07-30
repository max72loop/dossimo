import { describe, expect, it } from "vitest";

import { agregerTunnel, taux, type DonneesTunnel } from "@/lib/mesure/tunnel";

/**
 * Ce que ce tableau de bord doit refuser de dire.
 *
 * Un tunnel qui se trompe ne plante pas : il affiche un chiffre flatteur et on
 * décide dessus. Les cas ci-dessous sont donc tous des cas où le comptage
 * pourrait mentir dans le bon sens, et où il ne doit pas.
 */

const VIDE: DonneesTunnel = {
  contacts: [],
  evenements: [],
  artisans: [],
  dossiers: [],
  paiements: [],
  retours: [],
  appels: [],
  paliers: [],
};

const HIER = "2026-07-26T10:00:00.000Z";
const VIEUX = "2026-01-01T10:00:00.000Z";
const DEPUIS = "2026-07-20T00:00:00.000Z";

const dossier = (id: string, over: Partial<DonneesTunnel["dossiers"][number]> = {}) => ({
  id,
  statut: "livre" as const,
  created_at: HIER,
  tier_id: "t1",
  final_price_cents: 14900,
  ...over,
});

describe("taux", () => {
  it("rend null plutôt que 0 % sur un dénominateur vide", () => {
    // « 0 % de conversion » et « personne n'est passé par là » sont deux
    // messages opposés. Le second ne doit jamais s'afficher comme le premier.
    expect(taux(0, 0)).toBeNull();
    expect(taux(3, null)).toBeNull();
    expect(taux(1, 4)).toBe(0.25);
  });
});

describe("agregerTunnel : l'entonnoir", () => {
  it("laisse la visite non mesurée à null, sans casser la chaîne de conversion", () => {
    const t = agregerTunnel(
      { ...VIDE, evenements: [ev("essai_commence"), ev("devis_lu")] },
      null,
    );
    const visite = t.etapes.find((e) => e.cle === "visite");
    expect(visite?.valeur).toBeNull();
    expect(t.etapes.find((e) => e.cle === "essai")?.valeur).toBe(1);
  });

  it("ne compte pas hors fenêtre", () => {
    const evenements = [ev("essai_commence", { created_at: VIEUX }), ev("essai_commence")];
    expect(agregerTunnel({ ...VIDE, evenements }, DEPUIS).etapes.find((e) => e.cle === "essai")?.valeur).toBe(1);
    expect(agregerTunnel({ ...VIDE, evenements }, null).etapes.find((e) => e.cle === "essai")?.valeur).toBe(2);
  });

  it("ne compte « dossier complété » que les statuts réellement atteints", () => {
    // L'ordre physique de l'enum ne suit pas le parcours (README §3) : un
    // comparateur `>` compterait `livre` et raterait `pret_depot`.
    const dossiers = [
      dossier("a", { statut: "nouveau" }),
      dossier("b", { statut: "pret_depot" }),
      dossier("c", { statut: "livre" }),
    ];
    const t = agregerTunnel({ ...VIDE, dossiers }, null);
    expect(t.etapes.find((e) => e.cle === "dossier")?.valeur).toBe(2);
  });
});

describe("agregerTunnel : qualité", () => {
  it("exclut « lecture non activée » du taux d'échec de lecture", () => {
    // Une clé API absente n'est pas un produit qui ne sait pas lire les devis.
    const evenements = [
      ev("essai_commence"),
      ev("essai_commence"),
      ev("devis_echec", { motif: "non_configure" }),
      ev("devis_echec", { motif: "illisible" }),
    ];
    const { qualite } = agregerTunnel({ ...VIDE, evenements }, null);
    expect(qualite.echecsLecture).toBe(1);
    expect(qualite.tauxEchecLecture).toBe(0.5);
  });

  it("sépare la panne de service du document illisible", () => {
    const evenements = [
      ev("devis_echec", { motif: "service_indisponible" }),
      ev("devis_echec", { motif: "illisible" }),
    ];
    const { qualite } = agregerTunnel({ ...VIDE, evenements }, null);
    expect(qualite.echecsService).toBe(1);
    expect(qualite.echecsIllisible).toBe(1);
  });

  it("ne compte une reprise non renseignée ni comme « avec », ni comme « sans »", () => {
    const retours = [
      retour("a", { reprise_demandee: true }),
      retour("b", { reprise_demandee: false }),
      retour("c", { reprise_demandee: null }),
    ];
    const { qualite } = agregerTunnel({ ...VIDE, retours }, null);
    expect(qualite.retoursRenseignes).toBe(2);
    expect(qualite.tauxReprise).toBe(0.5);
    expect(qualite.repriseInconnue).toBe(1);
  });
});

describe("agregerTunnel : la métrique principale", () => {
  const base = {
    dossiers: [dossier("a"), dossier("b"), dossier("c")],
    paiements: [paye("a"), paye("b"), paye("c")],
  };

  it("ne compte que payé + accepté + sans reprise", () => {
    const t = agregerTunnel(
      {
        ...VIDE,
        ...base,
        retours: [
          retour("a", { reprise_demandee: false }),
          retour("b", { reprise_demandee: true }),
          retour("c", { statut: "refuse", reprise_demandee: false }),
        ],
      },
      null,
    );
    expect(t.payesAcceptesSansReprise).toBe(1);
  });

  it("range à part, et n'invente pas, les dossiers dont la reprise est inconnue", () => {
    // Le piège : compter « accepté sans information » comme « accepté sans
    // reprise » ferait afficher au produit la preuve de sa propre réussite.
    const t = agregerTunnel(
      { ...VIDE, ...base, retours: [retour("a"), retour("b"), retour("c")] },
      null,
    );
    expect(t.payesAcceptesSansReprise).toBe(0);
    expect(t.payesAcceptesRepriseInconnue).toBe(3);
  });

  it("ignore un dossier accepté mais jamais payé", () => {
    const t = agregerTunnel(
      {
        ...VIDE,
        dossiers: [dossier("a")],
        paiements: [{ dossier_id: "a", statut: "en_attente", created_at: HIER }],
        retours: [retour("a", { reprise_demandee: false })],
      },
      null,
    );
    expect(t.payesAcceptesSansReprise).toBe(0);
  });
});

describe("agregerTunnel : unit economics", () => {
  it("compte le prix réellement payé, pas le prix affiché du palier", () => {
    // Un dossier offert via un crédit de parrainage rapporte 0 €. Prendre
    // `price_cents` ferait apparaître un revenu qui n'a jamais été encaissé.
    const t = agregerTunnel(
      {
        ...VIDE,
        dossiers: [dossier("a", { final_price_cents: 0 }), dossier("b")],
        paiements: [paye("a"), paye("b")],
        paliers: [{ id: "t1", name: "Pivot", price_cents: 14900 }],
      },
      null,
    );
    expect(t.paliers[0].dossiersPayes).toBe(2);
    expect(t.paliers[0].revenuCents).toBe(14900);
  });

  it("signale un coût incomplet au lieu de le combler", () => {
    const t = agregerTunnel(
      {
        ...VIDE,
        dossiers: [dossier("a")],
        paiements: [paye("a")],
        paliers: [{ id: "t1", name: "Pivot", price_cents: 14900 }],
        appels: [
          { dossier_id: "a", cout_micro_usd: 1200, created_at: HIER },
          { dossier_id: "a", cout_micro_usd: null, created_at: HIER },
        ],
      },
      null,
    );
    expect(t.paliers[0].coutMicroUsd).toBe(1200);
    expect(t.paliers[0].coutIncomplet).toBe(true);
  });
});

// --- fabriques ------------------------------------------------------------

function ev(
  type: DonneesTunnel["evenements"][number]["type"],
  over: Partial<DonneesTunnel["evenements"][number]> = {},
): DonneesTunnel["evenements"][number] {
  return { type, motif: null, minutes: null, dossier_id: null, created_at: HIER, ...over };
}

function retour(
  dossier_id: string,
  over: Partial<DonneesTunnel["retours"][number]> = {},
): DonneesTunnel["retours"][number] {
  return { dossier_id, statut: "accepte", reprise_demandee: null, updated_at: HIER, ...over };
}

function paye(dossier_id: string): DonneesTunnel["paiements"][number] {
  return { dossier_id, statut: "paye", created_at: HIER };
}
