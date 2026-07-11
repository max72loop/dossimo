import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ActionsRestantes } from "@/components/dossier/actions-restantes";
import { MetriquesValeur } from "@/components/dossier/metriques-valeur";
import { VerdictHero } from "@/components/dossier/verdict-hero";
import { syntheseDossier, type PieceSynthese } from "@/lib/dossier/synthese";
import type { Finding, RapportControle } from "@/lib/rules/types";
import type { StatutDossier } from "@/lib/database.types";

function finding(severite: Finding["severite"], code: string): Finding {
  return { code, categorie: "technique", severite, titre: code, detail: "d" };
}

function rapport(findings: Finding[]): RapportControle {
  const nbBloquants = findings.filter((f) => f.severite === "bloquant").length;
  return {
    findings,
    nbBloquants,
    nbAvertissements: findings.filter((f) => f.severite === "avertissement").length,
    nbConformes: findings.filter((f) => f.severite === "ok").length,
    conforme: nbBloquants === 0,
  };
}

const HUIT_CONFORMES = rapport(
  Array.from({ length: 8 }, (_, i) => finding("ok", `ok${i}`)),
);

function synthese(opts: {
  rapport?: RapportControle;
  pieces?: PieceSynthese[];
  statut?: StatutDossier;
}) {
  return syntheseDossier({
    rapport: opts.rapport ?? HUIT_CONFORMES,
    pieces: opts.pieces ?? [],
    statut: opts.statut ?? "nouveau",
    mentionsTotal: 6,
  });
}

describe("VerdictHero", () => {
  it("annonce le verdict, la preuve chiffrée et la prime retenue", () => {
    const html = renderToStaticMarkup(
      <VerdictHero
        synthese={synthese({})}
        primeRetenue={1200}
        primeLabel="Prime CEE retenue"
      />,
    );
    expect(html).toContain("Dossier conforme");
    expect(html).toContain("8 contrôles anti-refus passés");
    expect(html).toContain("0 point bloquant");
    expect(html).toContain("Prime CEE retenue");
  });

  it("affiche le montant retenu au format unique « 1 200,00 € »", () => {
    const html = renderToStaticMarkup(
      <VerdictHero synthese={synthese({})} primeRetenue={1200} primeLabel="Prime" />,
    );
    // Le séparateur de milliers est une espace insécable, jamais rien.
    expect(html).toMatch(/1 200,00 €/);
    expect(html).not.toContain("1200,00");
  });

  it("expose la complétude et les actions restantes, cohérentes entre elles", () => {
    const html = renderToStaticMarkup(
      <VerdictHero synthese={synthese({})} primeRetenue={null} primeLabel="Prime" />,
    );
    expect(html).toContain("Dossier complété à 40 %");
    expect(html).toContain("Il reste 3 actions avant Prêt à déposer");
    expect(html).toContain('aria-valuenow="40"');
    expect(html).toContain("width:40%");
  });

  it("bascule sur un ton d'attention quand un point bloquant existe", () => {
    const s = synthese({ rapport: rapport([finding("bloquant", "x")]) });
    const html = renderToStaticMarkup(
      <VerdictHero synthese={s} primeRetenue={760} primeLabel="Prime" />,
    );
    expect(html).toContain("Dossier à corriger");
    expect(html).toContain("1 point bloquant");
    expect(html).not.toContain("Dossier conforme");
  });

  it("annonce Prêt à déposer quand tout est fait", () => {
    const s = synthese({
      pieces: [
        { type: "devis", lue: true, nbEcarts: 0, mentionsPresentes: 6 },
        { type: "facture", lue: true, nbEcarts: 0, mentionsPresentes: 6 },
      ],
      statut: "pret_depot",
    });
    const html = renderToStaticMarkup(
      <VerdictHero synthese={s} primeRetenue={1200} primeLabel="Prime" />,
    );
    expect(html).toContain("Dossier complété à 100 %");
    expect(html).toContain("Prêt à déposer");
    expect(html).not.toContain("Il reste");
  });
});

describe("ActionsRestantes", () => {
  it("présente les actions restantes, pas des alertes de refus", () => {
    const html = renderToStaticMarkup(
      <ActionsRestantes synthese={synthese({})} />,
    );
    expect(html).toContain("Actions restantes pour passer Prêt à déposer");
    expect(html).toContain("3 actions restantes");
    expect(html).toContain("Ajouter le devis réel");
    expect(html).toContain("Ajouter la facture réelle");
  });

  it("accorde les libellés en genre", () => {
    const s = synthese({
      pieces: [
        { type: "devis", lue: true, nbEcarts: 0, mentionsPresentes: 6 },
        { type: "facture", lue: true, nbEcarts: 0, mentionsPresentes: 6 },
      ],
    });
    const html = renderToStaticMarkup(<ActionsRestantes synthese={s} />);
    expect(html).toContain("Devis vérifié et cohérent avec la saisie");
    expect(html).toContain("Facture vérifiée et cohérente avec la saisie");
  });

  it("rassure sur les contrôles automatiques déjà validés", () => {
    const html = renderToStaticMarkup(<ActionsRestantes synthese={synthese({})} />);
    expect(html).toContain("Les contrôles automatiques");
    expect(html).toContain("8 points conformes");
  });

  it("un dossier conforme n'affiche aucun bloc rouge alarmant", () => {
    const html = renderToStaticMarkup(<ActionsRestantes synthese={synthese({})} />);
    expect(html).not.toContain("text-erreur");
    expect(html).not.toContain("bg-erreur-bg");
  });

  it("réserve le rouge aux vrais points bloquants", () => {
    const s = synthese({ rapport: rapport([finding("bloquant", "x")]) });
    const html = renderToStaticMarkup(<ActionsRestantes synthese={s} />);
    expect(html).toContain("Corriger 1 point bloquant");
    expect(html).toContain("text-erreur");
  });
});

describe("MetriquesValeur", () => {
  it("dérive les trois métriques des données réelles", () => {
    const html = renderToStaticMarkup(<MetriquesValeur synthese={synthese({})} />);
    // 5 documents × 15 min + 8 contrôles × 3 min = 99 min
    expect(html).toContain("≈ 1 h 39");
    expect(html).toContain("Temps estimé gagné");
    expect(html).toContain("0 / 6");
    expect(html).toContain("Faible");
  });

  it("compte les mentions vérifiées une fois le devis lu", () => {
    const s = synthese({ pieces: [{ type: "devis", lue: true, nbEcarts: 0, mentionsPresentes: 6 }] });
    const html = renderToStaticMarkup(<MetriquesValeur synthese={s} />);
    expect(html).toContain("6 / 6");
  });

  it("le risque de refus reprend l'indicateur unique", () => {
    const eleve = synthese({ rapport: rapport([finding("bloquant", "x")]) });
    expect(renderToStaticMarkup(<MetriquesValeur synthese={eleve} />)).toContain("Élevé");

    const moyen = synthese({ rapport: rapport([finding("avertissement", "x")]) });
    expect(renderToStaticMarkup(<MetriquesValeur synthese={moyen} />)).toContain("Moyen");
  });
});
