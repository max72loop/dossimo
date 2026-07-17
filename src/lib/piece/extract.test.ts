import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { extractPiece } from "@/lib/piece/extract";

/**
 * L'extraction de bout en bout, VLM simulé : réponse du modèle → JSON → schéma →
 * valeurs exploitables. Ce qui compte ici n'est pas le prompt mais ce qui ressort
 * du schéma, puisque c'est ce que `compare.ts` confronte à la saisie.
 */

const reponseVlm = (charge: Record<string, unknown>) =>
  new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(charge) } }] }),
    { status: 200 },
  );

// Document déjà préparé : la préparation (borne de pages, encodage) est testée à
// part dans document.test.ts ; ici le contenu de la dataUrl n'importe pas, fetch
// étant simulé.
const DOC = {
  mime: "application/pdf",
  filename: "devis.pdf",
  dataUrl: "data:application/pdf;base64,JVBERi0=",
};

/** Lance l'extraction sur la réponse VLM déjà armée, et exige qu'elle aboutisse. */
const lire = () =>
  extractPiece({ doc: DOC, type: "devis", famille: "isolation" }).then((r) => {
    if (!r.ok) throw new Error(`extraction en échec : ${JSON.stringify(r)}`);
    return r.data;
  });

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "sk-or-v1-clefdetestsuffisammentlongue";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      throw new Error("réponse non configurée");
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("extractPiece", () => {
  it("lit les montants au point de milliers sans les diviser par mille", async () => {
    // Le bug de production : « 4.200,50 » ressortait à 4,2 et fabriquait un écart
    // bloquant sur un champ critique, sans recours pour l'artisan.
    vi.mocked(fetch).mockResolvedValue(
      reponseVlm({ montant_ht: "3.500,42", montant_ttc: "4.200,50 €" }),
    );
    const data = await lire();
    expect(data.montant_ht).toBe(3500.42);
    expect(data.montant_ttc).toBe(4200.5);
  });

  it("lit les formats FR à espace et virgule", async () => {
    vi.mocked(fetch).mockResolvedValue(
      reponseVlm({ montant_ttc: "4 200,00 €", surface_isolee_m2: "95 m²", resistance_thermique_r: "7,5" }),
    );
    const data = await lire();
    expect(data.montant_ttc).toBe(4200);
    expect(data.surface_isolee_m2).toBe(95);
    expect(data.resistance_thermique_r).toBe(7.5);
  });

  it("garde une résistance thermique décimale écrite au point", async () => {
    vi.mocked(fetch).mockResolvedValue(reponseVlm({ resistance_thermique_r: "4.2" }));
    expect((await lire()).resistance_thermique_r).toBe(4.2);
  });

  it("accepte les nombres déjà typés et les champs absents", async () => {
    vi.mocked(fetch).mockResolvedValue(
      reponseVlm({ montant_ttc: 4200.5, surface_isolee_m2: null }),
    );
    const data = await lire();
    expect(data.montant_ttc).toBe(4200.5);
    expect(data.surface_isolee_m2).toBeNull();
    expect(data.isolant_marque).toBeNull();
  });

  it("déballe un JSON enrobé de balises markdown", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: '```json\n{"montant_ttc": "4.200,50"}\n```' } },
          ],
        }),
        { status: 200 },
      ),
    );
    expect((await lire()).montant_ttc).toBe(4200.5);
  });

  it("distingue un service indisponible d'un document illisible", async () => {
    // Sans cette distinction, un quota dépassé invitait l'artisan à rescanner un
    // document parfaitement net.
    vi.mocked(fetch).mockResolvedValue(new Response("quota", { status: 429 }));
    const r = await extractPiece({ doc: DOC, type: "devis", famille: "isolation" });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("inattendu");
    expect(r.message).toContain("momentanément indisponible");
    expect(r.message).not.toContain("lisible");
  });

  it("signale l'absence de configuration sans appeler le réseau", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const r = await extractPiece({ doc: DOC, type: "devis", famille: "isolation" });
    expect(r).toEqual({ ok: false, reason: "non-configure" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
