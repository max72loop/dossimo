import { z } from "zod";

/**
 * Schéma de la demande de diagnostic `/refus`.
 *
 * Partagé entre le formulaire et la Server Action, mais **la validation qui fait
 * foi est celle du serveur** : le client ne fait que du confort (messages
 * immédiats, bouton désactivé). Rien de ce qui arrive ici n'est présumé venir de
 * notre propre formulaire.
 *
 * Les valeurs des unions sont les mêmes que les `check` de la migration 0053 :
 * les deux doivent rester en miroir, comme `database.types.ts` l'est du schéma.
 */

/** Un champ texte facultatif : espaces rognés, chaîne vide ramenée à null. */
const texteFacultatif = (max: number) =>
  z.preprocess(
    (v) => {
      if (typeof v !== "string") return v ?? null;
      const t = v.trim();
      return t === "" ? null : t;
    },
    z.string().max(max).nullable(),
  );

/**
 * Pas de valeur `particulier` : l'aiguillage du cluster mène un particulier vers
 * une page statique, sans aucune collecte (docs/cluster-refus.md § 3.4).
 * L'absence de la valeur ici, et le `check` en base, sont les deux gardes qui
 * empêchent la branche B2C de rentrer par la porte de service.
 */
export const PROFILS = ["artisan_rge", "autre"] as const;
export const AIDES = ["maprimerenov", "cee", "les_deux"] as const;

/**
 * Date de notification : optionnelle, et **jamais interprétée**. Aucun compte à
 * rebours, aucun verdict de recevabilité n'en est dérivé (assertion A2 : les
 * délais opposables sont ceux portés par la notification reçue). On ne valide
 * donc que la vraisemblance : une date réelle, ni absurde ni dans le futur.
 */
const DATE_MIN = "2015-01-01";

const dateNotification = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v ?? null;
    const t = v.trim();
    return t === "" ? null : t;
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.")
    .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Date invalide.")
    .refine((s) => s >= DATE_MIN, "Date trop ancienne pour être une notification de refus.")
    .refine(
      (s) => s <= new Date().toISOString().slice(0, 10),
      "La date de notification ne peut pas être dans le futur.",
    )
    .nullable(),
);

export const demandeRefusSchema = z
  .object({
    profil: z.enum(PROFILS, { message: "Précisez qui vous êtes." }),
    aide: z.enum(AIDES).nullable().optional().default(null),
    geste: texteFacultatif(120),
    email: z.email("Adresse e-mail invalide."),
    telephone: texteFacultatif(40),
    date_notification: dateNotification,
    motif_libre: texteFacultatif(4000),

    /**
     * Case de consentement. `z.literal(true)` plutôt qu'un booléen : une case
     * décochée doit produire une ERREUR DE CHAMP, pas une ligne en base sans
     * consentement. C'est la garde qui rend le consentement réellement bloquant.
     */
    consentement_contact: z.literal(true, {
      message: "Votre accord est nécessaire pour que nous puissions vous répondre.",
    }),

    /** Champ invisible. Écarte les robots opportunistes avant toute écriture. */
    website: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().max(0).optional().or(z.literal("")),
    ),

    utm_source: texteFacultatif(120),
    utm_medium: texteFacultatif(120),
    utm_campaign: texteFacultatif(120),
  })
  /**
   * Une demande doit porter quelque chose à diagnostiquer. Sans upload en lot 1,
   * ce quelque chose est nécessairement le texte libre : une demande qui n'a ni
   * motif décrit ni aide identifiée ne peut donner lieu à aucun diagnostic, et
   * la recevoir revient à promettre une réponse qu'on ne peut pas écrire.
   */
  .refine((d) => (d.motif_libre?.length ?? 0) >= 20, {
    path: ["motif_libre"],
    message: "Décrivez le motif du refus en quelques mots (20 caractères minimum).",
  });

export type DemandeRefus = z.infer<typeof demandeRefusSchema>;
