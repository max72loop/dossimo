import {
  Mails,
  Database,
  Scale,
  FileText,
  Filter,
  Contact,
  ClipboardCheck,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

/**
 * Les consoles admin, source unique.
 *
 * Cette liste servait au seul sommaire `/admin`, et chaque page bricolait ensuite
 * ses propres liens de retour : `/admin/regles` faisait office de hub par
 * accident, `/admin/tunnel` était la seule à remonter vers le sommaire, et
 * `/admin/contacts` n'avait aucun lien sortant. Le sommaire créé pour naviguer
 * était donc inatteignable depuis huit pages sur dix.
 *
 * La barre de navigation du layout et le sommaire lisent désormais la même
 * liste : ajouter une console ici la rend visible partout, ou nulle part.
 *
 * Pas de fonction ici : ce module est importé par un composant client
 * (`nav-admin.tsx`). Les chiffres du sommaire vivent dans
 * `src/lib/admin/sommaire.ts`, côté serveur, indexés par `href`.
 */
export type Section = {
  href: string;
  titre: string;
  /** Ce qu'on vient y faire, en une phrase. */
  aide: string;
  icone: LucideIcon;
  /** Libellé court pour la barre de navigation, quand le titre est trop long. */
  court?: string;
};

export type Rubrique = {
  titre: string;
  consoles: Section[];
};

/** La prospection d'abord : c'est le travail quotidien tant que le pilote recrute. */
const PROSPECTION: Rubrique = {
  titre: "Prospection",
  consoles: [
    {
      href: "/admin/contacts",
      titre: "Contacts",
      aide: "Chercher un artisan, voir qui a été appelé, mailé, whatsappé, et qui a répondu par quoi. Marquer les échanges et les relances.",
      icone: Contact,
    },
    {
      href: "/admin/prospection",
      titre: "File e-mail",
      aide: "Relire et valider les messages automatiques avant qu'ils partent, importer des prospects, mettre la campagne en pause.",
      icone: Mails,
    },
  ],
};

const PILOTAGE: Rubrique = {
  titre: "Pilotage",
  consoles: [
    {
      href: "/admin/tunnel",
      titre: "Tunnel d'entreprise",
      court: "Tunnel",
      aide: "Du contact au dossier accepté sans reprise : conversion par étape, par source et par palier, coût de production, temps passé.",
      icone: Filter,
    },
    {
      href: "/admin/pilotage",
      titre: "Retours de dépôt",
      aide: "Ce que les dépôts sont devenus : acceptés, refusés et pourquoi, et quel obligé a été choisi.",
      icone: ClipboardCheck,
    },
  ],
};

const PRODUIT: Rubrique = {
  titre: "Produit et données",
  consoles: [
    {
      href: "/admin/regles",
      titre: "Règles métier",
      court: "Règles",
      aide: "Éditer les seuils, pièces et versions de fiche par geste. Une modification ici change le contrôle anti-refus tout de suite.",
      icone: Scale,
    },
    {
      href: "/admin/devis",
      titre: "Modèles de devis",
      court: "Devis",
      aide: "Publier une version de modèle par geste, avec sa source et sa période d'effet.",
      icone: FileText,
    },
    {
      href: "/admin/donnees",
      titre: "Données",
      aide: "Inventaire des dossiers, suppression des saisies de test, questions en langage naturel sur la base.",
      icone: Database,
    },
  ],
};

/** Ordre d'affichage du sommaire et de la barre. */
export const RUBRIQUES: Rubrique[] = [PROSPECTION, PILOTAGE, PRODUIT];

export const SOMMAIRE: Section = {
  href: "/admin",
  titre: "Sommaire",
  aide: "Toutes les consoles internes.",
  icone: LayoutGrid,
};
