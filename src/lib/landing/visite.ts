/**
 * Visite guidée de la vitrine : source unique de l'identifiant et des URL.
 *
 * La visite est un parcours interactif hébergé par Supademo, capturé sur l'app
 * réelle. Elle est délibérément NEUTRE quant au geste : le tronc commun montré
 * (dépôt du devis → préremplissage → contrôles → pack) est le même pour
 * l'isolation, la pompe à chaleur, le chauffe-eau et le chauffage au bois, et le
 * seul écran de caractéristiques techniques conservé dit lui-même que ces champs
 * changent selon la fiche. Une visite typée sur un seul geste écartait tous les
 * autres corps de métier.
 *
 * Un seul endroit à modifier quand la démo est remplacée : l'identifiant vit ici et
 * n'est jamais recopié dans un composant (deux sources pour une valeur = elles
 * divergent). Aucune durée ni nombre d'étapes n'est annoncé sur le site : ce sont
 * des valeurs qui bougent à chaque retouche de la démo, et Dossimo n'affiche pas un
 * chiffre qu'il ne peut pas tenir (AGENTS.md).
 */
const ID = "cms6l7xck00v9yq0jup68rp8w";

/**
 * Origine de l'hébergeur. Elle sert DEUX choses qui doivent rester d'accord : les
 * URL ci-dessous et la directive `frame-src` de la politique de sécurité
 * ([`lib/security/csp.ts`](../security/csp.ts)). Sans cette seconde, la `iframe`
 * retombe sur `default-src 'self'` et le navigateur affiche « Ce contenu est
 * bloqué » — c'est arrivé en production le 2026-07-30.
 */
const ORIGINE = "https://app.supademo.com";

export const VISITE = {
  id: ID,
  titre: "Du devis au dossier prêt à déposer",
  origine: ORIGINE,
  /** Lien direct : ouverture en plein écran, partage, prospection. */
  lien: `${ORIGINE}/demo/${ID}`,
  /** URL d'embarquement dans un `iframe` (paramètres imposés par Supademo). */
  embed: `${ORIGINE}/embed/${ID}?embed_v=2&utm_source=dossimo`,
  /** Rapport largeur/hauteur des captures de la démo (1920 × 945). */
  ratio: "1920 / 945",
  hebergeur: "Supademo",
  /**
   * Affiche montrée avant le clic : une **vraie capture de l'app**, servie
   * depuis `public/` et non depuis l'hébergeur, pour que la règle « rien du
   * tiers avant le clic » (DESIGN.md §5) tienne toujours.
   *
   * `etape` est le numéro d'étape de la démo dont la capture est reprise. Le
   * fichier n'est pas déposé à la main : `node scripts/visite-affiche.mjs` le
   * dérive de la démo, bandeau applicatif retiré (il porte le nom de
   * l'entreprise connectée, et la vitrine est sans donnée nominative). **À
   * relancer chaque fois que la démo est remplacée**, sinon l'affiche promet un
   * écran que la visite ne montre plus. Les dimensions sont celles du fichier
   * produit : elles évitent que le navigateur réserve une hauteur fausse.
   */
  affiche: {
    src: "/visite/apercu.webp",
    etape: 19,
    largeur: 1600,
    hauteur: 746,
  },
} as const;
