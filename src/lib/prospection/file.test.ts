import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contrat du moteur d'envoi.
 *
 * Ce fichier existe à cause d'une panne : `validerFile` filtrait sur
 * `scheduled_on = aujourd'hui` quand `envoyerProchain` sélectionnait
 * `scheduled_on <= aujourd'hui`. Un lot préparé un jour et non validé le jour
 * même devenait invalidable à jamais, et 40 prospects sont sortis de la campagne
 * sans que rien ne le signale. Le moteur (799 lignes) n'avait alors aucun test.
 *
 * Ce qui est vérifié ici est donc surtout ce qui, en se désalignant, produit un
 * silence : les garde-fous que l'envoi manuel a le droit de lever, et ceux qu'il
 * ne doit jamais lever.
 */

const envoyerMessage = vi.fn();

vi.mock("@/lib/prospection/envoi", () => ({
  envoyerMessage: (...args: unknown[]) => envoyerMessage(...args),
}));

/**
 * Réponses servies au client Supabase simulé, consommées dans l'ordre d'appel
 * pour chaque table. L'ordre est déterministe : voir `envoyerProchain`.
 */
let reponses: Record<string, unknown[]> = {};

function servir(table: string): unknown {
  const file = reponses[table];
  if (!file || file.length === 0) {
    throw new Error(`Aucune réponse simulée en réserve pour « ${table} »`);
  }
  return file.shift();
}

/**
 * Constructeur de requête simulé : toutes les méthodes de chaînage se rendent
 * elles-mêmes, et le résultat est servi soit en `await`, soit par `maybeSingle`.
 */
function constructeur(resultat: unknown) {
  const b: Record<string, unknown> = {
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) =>
      Promise.resolve(resultat).then(ok, ko),
    maybeSingle: () => Promise.resolve(resultat),
    single: () => Promise.resolve(resultat),
  };
  for (const m of ["select", "eq", "in", "lte", "gte", "order", "limit", "update", "insert"]) {
    b[m] = () => b;
  }
  return b;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => constructeur(servir(table)),
  }),
}));

const { TAILLE_SALVE, envoyerProchain, envoyerSalve } = await import(
  "@/lib/prospection/file"
);

const CAMPAGNE = {
  id: "camp-1",
  nom: "Campagne de test",
  objet: "Objet de campagne",
  corps: "Corps de campagne",
  demarre_le: "2026-07-18",
  termine_le: "2026-09-30",
  daily_cap_max: 40,
  en_pause: false,
  motif_pause: null,
  actif: true,
};

/** Un message prêt à partir. `notes: null` : aucun `place_id`, donc aucun report fichier. */
function messageValide(id = "msg-1") {
  return {
    id,
    prospect_id: `prospect-${id}`,
    objet: "Vos dossiers de prime",
    corps: "Bonjour, ceci est le corps du message.",
    scheduled_on: "2026-08-27",
    prospects: {
      email: `${id}@example.com`,
      unsubscribe_token: "jeton-desinscription",
      prenom: "Camille",
      source: "annuaire RGE",
      notes: null,
    },
  };
}

/** Les réponses d'un envoi qui va au bout, dans l'ordre où le moteur les demande. */
function envoiReussi(id: string) {
  return {
    prospection_campagnes: [{ data: CAMPAGNE, error: null }],
    prospection_messages: [
      { count: 0, error: null }, // envoyés aujourd'hui
      { data: messageValide(id), error: null }, // candidat
      { data: { id }, error: null }, // réservation optimiste
    ],
    prospects: [{ data: null, error: null }], // passage en « contacte »
    prospection_evenements: [{ data: null, error: null }],
  };
}

/** Empile plusieurs jeux de réponses dans une seule réserve. */
function empiler(...jeux: Record<string, unknown[]>[]): Record<string, unknown[]> {
  const total: Record<string, unknown[]> = {};
  for (const jeu of jeux) {
    for (const [table, valeurs] of Object.entries(jeu)) {
      total[table] = [...(total[table] ?? []), ...valeurs];
    }
  }
  return total;
}

// 14h00 à Paris : dans la fenêtre 9h30-18h30.
const DANS_LA_FENETRE = new Date("2026-08-28T12:00:00.000Z");
// 22h00 à Paris : hors fenêtre.
const HORS_FENETRE = new Date("2026-08-28T20:00:00.000Z");

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://dossimo.app";
  envoyerMessage.mockReset();
  envoyerMessage.mockResolvedValue({ ok: true });
  reponses = {};
});

afterEach(() => {
  vi.useRealTimers();
});

describe("envoyerProchain — la fenêtre d'envoi", () => {
  it("refuse hors fenêtre par défaut, sans toucher à la file", async () => {
    reponses = { prospection_campagnes: [{ data: CAMPAGNE, error: null }] };

    const resultat = await envoyerProchain(HORS_FENETRE);

    expect(resultat).toEqual({ envoye: false, motif: "hors fenêtre d'envoi" });
    expect(envoyerMessage).not.toHaveBeenCalled();
  });

  it("envoie hors fenêtre quand l'envoi est déclenché à la main", async () => {
    reponses = envoiReussi("msg-1");

    const resultat = await envoyerProchain(HORS_FENETRE, { forcerHorsFenetre: true });

    expect(resultat).toEqual({
      envoye: true,
      messageId: "msg-1",
      destinataire: "msg-1@example.com",
    });
    expect(envoyerMessage).toHaveBeenCalledTimes(1);
  });
});

describe("envoyerProchain — ce que l'envoi manuel ne lève PAS", () => {
  it("respecte la pause de campagne", async () => {
    reponses = {
      prospection_campagnes: [{ data: { ...CAMPAGNE, en_pause: true }, error: null }],
    };

    const resultat = await envoyerProchain(HORS_FENETRE, { forcerHorsFenetre: true });

    expect(resultat).toEqual({ envoye: false, motif: "campagne en pause" });
    expect(envoyerMessage).not.toHaveBeenCalled();
  });

  it("respecte le plafond du jour", async () => {
    reponses = {
      prospection_campagnes: [{ data: CAMPAGNE, error: null }],
      prospection_messages: [{ count: 40, error: null }],
    };

    const resultat = await envoyerProchain(DANS_LA_FENETRE, { forcerHorsFenetre: true });

    expect(resultat).toEqual({
      envoye: false,
      motif: "plafond du jour atteint (40)",
    });
    expect(envoyerMessage).not.toHaveBeenCalled();
  });

  it("respecte les dates de la campagne", async () => {
    reponses = {
      prospection_campagnes: [
        { data: { ...CAMPAGNE, termine_le: "2026-08-01" }, error: null },
      ],
    };

    const resultat = await envoyerProchain(DANS_LA_FENETRE, { forcerHorsFenetre: true });

    expect(resultat).toEqual({ envoye: false, motif: "jour non couvert" });
    expect(envoyerMessage).not.toHaveBeenCalled();
  });
});

describe("envoyerProchain — le rattrapage des jours précédents", () => {
  it("envoie un message daté de la veille (non-régression du lot bloqué)", async () => {
    // `messageValide` porte `scheduled_on: 2026-08-27` alors qu'on est le 28 :
    // c'est exactement le lot que l'ancien filtre `eq` rendait inatteignable.
    reponses = envoiReussi("msg-veille");

    const resultat = await envoyerProchain(DANS_LA_FENETRE);

    expect(resultat).toMatchObject({ envoye: true, messageId: "msg-veille" });
  });

  it("remonte l'échec du transport sans prétendre avoir envoyé", async () => {
    envoyerMessage.mockResolvedValue({
      ok: false,
      erreur: "Webhook Google Apps Script non configuré.",
    });
    reponses = empiler(envoiReussi("msg-ko"), {
      prospection_messages: [{ data: null, error: null }], // passage en « echec »
    });

    const resultat = await envoyerProchain(DANS_LA_FENETRE);

    expect(resultat).toEqual({
      envoye: false,
      motif: "échec d'envoi : Webhook Google Apps Script non configuré.",
    });
  });
});

describe("envoyerSalve", () => {
  it("enchaîne les envois jusqu'à la taille demandée", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(DANS_LA_FENETRE);
    reponses = empiler(envoiReussi("a"), envoiReussi("b"));

    const promesse = envoyerSalve({ taille: 2 });
    await vi.runAllTimersAsync();

    expect(await promesse).toEqual({ envoyes: 2, motifArret: null });
    expect(envoyerMessage).toHaveBeenCalledTimes(2);
  });

  it("s'arrête au premier refus et le rapporte", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(DANS_LA_FENETRE);
    reponses = empiler(envoiReussi("a"), {
      prospection_campagnes: [{ data: CAMPAGNE, error: null }],
      prospection_messages: [
        { count: 1, error: null }, // sous le plafond
        { data: null, error: null }, // plus aucun candidat
      ],
    });

    const promesse = envoyerSalve({ taille: 5 });
    await vi.runAllTimersAsync();

    expect(await promesse).toEqual({ envoyes: 1, motifArret: "file vide" });
    expect(envoyerMessage).toHaveBeenCalledTimes(1);
  });

  it("rend le motif sans avoir rien envoyé quand la campagne est en pause", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(DANS_LA_FENETRE);
    reponses = {
      prospection_campagnes: [{ data: { ...CAMPAGNE, en_pause: true }, error: null }],
    };

    const promesse = envoyerSalve({ taille: TAILLE_SALVE });
    await vi.runAllTimersAsync();

    expect(await promesse).toEqual({ envoyes: 0, motifArret: "campagne en pause" });
  });
});

describe("la route /api/prospection/tick", () => {
  it("n'active JAMAIS le passe-droit de fenêtre", async () => {
    // Le garde-fou horaire ne protège plus que l'envoi automatique. Si un jour
    // quelqu'un passe `forcerHorsFenetre` ici « pour débloquer », la campagne
    // recommence à écrire à des artisans à 3h du matin.
    process.env.CRON_SECRET = "secret-de-test";
    vi.useFakeTimers();
    vi.setSystemTime(HORS_FENETRE);
    reponses = { prospection_campagnes: [{ data: CAMPAGNE, error: null }] };

    const { GET } = await import("@/app/api/prospection/tick/route");
    const reponse = await GET(
      new Request("https://dossimo.app/api/prospection/tick", {
        headers: { authorization: "Bearer secret-de-test" },
      }),
    );

    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({
      envoye: false,
      motif: "hors fenêtre d'envoi",
    });
    expect(envoyerMessage).not.toHaveBeenCalled();
  });
});

describe("campagneActive", () => {
  it("échoue au lieu de faire passer une panne de lecture pour « aucune campagne »", async () => {
    reponses = {
      prospection_campagnes: [{ data: null, error: { message: "connexion perdue" } }],
    };

    await expect(envoyerProchain(DANS_LA_FENETRE)).rejects.toThrow(
      /Lecture de la campagne active : connexion perdue/,
    );
  });
});
