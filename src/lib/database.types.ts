/**
 * Database types for the Dossimo Supabase schema.
 *
 * Hand-written to match the data model in CLAUDE.md §7. Once the schema lives
 * in Supabase, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type StatutDossier =
  | "nouveau"
  | "en_traitement"
  | "pret_depot"
  | "depose"
  | "livre";
export type Dispositif = "maprimerenov" | "cee";
export type StatutAbonnement = "aucun" | "actif" | "expire";
export type TypePaiement = "abonnement" | "ponctuel";
export type StatutPaiement = "en_attente" | "paye" | "echoue" | "rembourse";
/**
 * Pièces d'un dossier. Les identifiants reprennent ceux de la checklist
 * (`PieceRequise.id`) : c'est la clé commune qui relie « pièce exigée » et « pièce
 * réellement déposée ». Migration 0016.
 */
export type TypePiece =
  // Déposées par l'artisan
  | "devis"
  | "facture"
  | "qualification_rge"
  | "fiche_technique"
  | "cadre_contribution"
  | "attestation_honneur"
  | "photo_avant"
  | "photo_apres"
  | "autre"
  // Déposées par le bénéficiaire, via un lien de dépôt
  | "avis_imposition"
  | "piece_identite"
  | "titre_propriete"
  | "rib"
  | "attestation_bailleur";

/** Qui a déposé la pièce (migration 0017). */
export type Deposant = "artisan" | "beneficiaire";
export type StatutExtraction = "en_attente" | "ok" | "echec";
export type StatutValidationPiece = "submitted" | "approved" | "rejected";

/**
 * Étapes du tunnel qu'aucune table métier ne portait (migration 0051). Un
 * `text + check` côté base, une union ici : les deux doivent rester en miroir.
 */
export type TypeEvenementParcours =
  | "essai_commence"
  | "devis_lu"
  | "devis_echec"
  | "assistance";

/** Pourquoi une lecture de devis a échoué. Un service tombé n'est pas un document illisible. */
export type MotifEchecLecture = "non_configure" | "illisible" | "service_indisponible";

// Refonte de la prospection (migrations 0057 / 0058). Côté base, des
// `text + check` ; ici des unions. Les deux doivent rester en miroir.

/** Canal d'un échange. WhatsApp reste un canal même si le compte est bloqué : l'historique existe. */
export type CanalEchange = "email" | "whatsapp" | "telephone" | "sms" | "courrier";

/** Sens de l'échange. C'est lui qui rend « qui répond par quel canal » calculable. */
export type SensEchange = "sortant" | "entrant";

export type NatureEchange =
  // Sortant
  | "premier"
  | "relance"
  | "nurturing"
  | "appel"
  // Entrant ou signal
  | "ouverture"
  | "clic"
  | "reponse"
  | "stop"
  | "bounce"
  | "rdv"
  | "note";

/**
 * Comment l'échange s'est terminé. `echec_technique` vaut contact et jamais
 * contact à refaire : l'envoi a pu partir malgré l'erreur (cf. migration 0050).
 */
export type IssueEchange =
  | "sans_reponse"
  | "repondeur"
  | "faux_numero"
  | "mauvaise_adresse"
  | "interesse"
  | "refus"
  | "client"
  | "echec_technique";

/**
 * État commercial d'un contact. Écrit UNIQUEMENT par le trigger de la 0057
 * depuis les échanges, jamais saisi : c'est un fait observé, pas une opinion.
 * « à relancer » n'en fait pas partie, c'est une colonne calculée de
 * `contacts_synthese` parce qu'elle dépend du temps écoulé.
 */
export type EtatContact =
  | "jamais_contacte"
  | "contacte"
  | "en_discussion"
  | "client"
  | "refus"
  | "injoignable";

/** Sur quoi porte une opposition. Le SIREN survit à un changement d'adresse. */
export type TypeOpposition = "email" | "telephone" | "siren";

// Cluster « refus » (migrations 0053 / 0054). Côté base, des `text + check` ;
// ici, des unions. Les deux doivent rester en miroir.

/** Dispositif dont un motif de refus RELÈVE, pas celui qui le rencontre le plus. */
export type AideRefus = "maprimerenov" | "cee" | "les_deux";

/**
 * Profil du demandeur de diagnostic. Pas de `particulier` : l'aiguillage du
 * cluster mène un particulier vers une page statique, sans aucune collecte
 * (docs/cluster-refus.md § 3.4). L'absence de la valeur est la garde.
 */
export type ProfilRefus = "artisan_rge" | "autre";

export type StatutDemandeRefus = "nouveau" | "en_cours" | "traite" | "abandonne";

/**
 * Contenu éditorial d'un motif. La FAQ est facultative : le JSON-LD `FAQPage`
 * n'est émis que si elle existe réellement, même règle que `guide-page.tsx`.
 */
export interface ContenuMotifRefus {
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq?: Array<{ question: string; answer: string }>;
}

// Pricing + parrainage (migrations 0012 / 0013).
export type DossierBillingStatus =
  | "draft"
  | "priced"
  | "paid"
  | "deposited"
  | "refused"
  | "paid_out";
export type ReferralStatus =
  | "pending"
  | "rewarded"
  | "capped"
  | "self_blocked";
export type ReferralCreditStatus = "active" | "expired" | "consumed";

// Prospection B2B (migration 0032).
export type StatutProspect =
  | "nouveau"
  | "en_file"
  | "contacte"
  | "repondu"
  | "desinscrit"
  | "bounce"
  | "exclu"
  // Mis de côté pour un appel (migration 0052). Réversible, contrairement à
  // « exclu » : repasser à « nouveau » rend le contact à la file automatique.
  | "reserve_telephone";
export type StatutMessageProspection =
  | "en_attente"
  | "valide"
  | "envoye"
  | "echec"
  | "annule";
export type TypeEvenementProspection =
  | "envoi"
  | "clic"
  | "desinscription"
  | "bounce"
  | "reponse"
  | "ouverture";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      artisans: {
        Row: {
          id: string;
          user_id: string | null;
          entreprise: string;
          nom: string;
          prenom: string;
          email: string;
          telephone: string | null;
          adresse: string | null;
          code_postal: string | null;
          ville: string | null;
          siret: string | null;
          qualification_rge: string | null;
          statut_abonnement: StatutAbonnement;
          referral_code: string | null;
          credit_balance_cents: number;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          entreprise: string;
          nom: string;
          prenom: string;
          email: string;
          telephone?: string | null;
          adresse?: string | null;
          code_postal?: string | null;
          ville?: string | null;
          siret?: string | null;
          qualification_rge?: string | null;
          statut_abonnement?: StatutAbonnement;
          referral_code?: string | null;
          credit_balance_cents?: number;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["artisans"]["Insert"]>;
        Relationships: [];
      };
      // Fichier de prospection ADEME (créé hors migrations, clé `place_id`).
      // Colonnes de suivi ajoutées par la migration 0033.
      prospects_dossimo: {
        Row: {
          place_id: string;
          name: string | null;
          address: string | null;
          code_postal: string | null;
          city: string | null;
          phone: string | null;
          website: string | null;
          emails: string[] | null;
          siren: string | null;
          denomination: string | null;
          tranche_effectif: string | null;
          rge_domaines: string[] | null;
          score: number | null;
          statut: string | null;
          source: string | null;
          source_query: string | null;
          created_at: string;
          updated_at: string;
          canal: string | null;
          email_valide: boolean | null;
          date_envoi: string | null;
          date_relance: string | null;
          /** Dernière édition de nurturing reçue (migration 0037). Récurrente, écrasée chaque mois. */
          date_nurturing: string | null;
          reponse: boolean | null;
          essai_demo: boolean | null;
          dossier_paye: boolean | null;
          opt_out: boolean | null;
          question_posee: string | null;
          notes: string | null;
          /**
           * Campagne AUTOMATIQUE (0032), pas le sprint manuel (migration 0050).
           * Jour de l'envoi et son issue : « echec » vaut contact, le message a pu
           * partir malgré l'erreur. Null = jamais démarché par cette voie.
           */
          contact_auto_le: string | null;
          contact_auto_statut: "envoye" | "echec" | null;
        };
        Insert: {
          place_id: string;
          name?: string | null;
          address?: string | null;
          code_postal?: string | null;
          city?: string | null;
          phone?: string | null;
          website?: string | null;
          emails?: string[] | null;
          siren?: string | null;
          denomination?: string | null;
          tranche_effectif?: string | null;
          rge_domaines?: string[] | null;
          score?: number | null;
          statut?: string | null;
          source?: string | null;
          source_query?: string | null;
          created_at?: string;
          updated_at?: string;
          canal?: string | null;
          email_valide?: boolean | null;
          date_envoi?: string | null;
          date_relance?: string | null;
          date_nurturing?: string | null;
          reponse?: boolean | null;
          essai_demo?: boolean | null;
          dossier_paye?: boolean | null;
          opt_out?: boolean | null;
          question_posee?: string | null;
          notes?: string | null;
          contact_auto_le?: string | null;
          contact_auto_statut?: "envoye" | "echec" | null;
        };
        Update: Partial<Database["public"]["Tables"]["prospects_dossimo"]["Insert"]>;
        Relationships: [];
      };

      /**
       * Refonte de la prospection (migration 0057). Remplace `prospects_dossimo`
       * ET `prospects`, qui décrivaient les mêmes 2 990 artisans sous deux clés.
       * Clé métier : le SIREN, parce que c'est la seule partagée avec l'annuaire
       * RGE, donc la seule qui permette de répondre à « y a-t-il des nouveaux ».
       *
       * `etat`, `telephone`, `telephone_mobile`, `emails`, `email_principal` et
       * `updated_at` sont tenus par des TRIGGERS : ne jamais les écrire à la
       * main, la base les recalculera par-dessus.
       */
      contacts: {
        Row: {
          id: string;
          siren: string;
          /** Ancienne clé de `prospects_dossimo`, gardée pour la traçabilité. Jamais une clé ici. */
          place_id: string | null;
          denomination: string | null;
          nom: string | null;
          address: string | null;
          code_postal: string | null;
          city: string | null;
          /** Normalisé par trigger : 10 chiffres, ou null si inexploitable. */
          telephone: string | null;
          /** Dérivé du téléphone par trigger : 06/07, donc joignable WhatsApp ou SMS. */
          telephone_mobile: boolean | null;
          emails: string[] | null;
          email_principal: string | null;
          email_valide: boolean | null;
          website: string | null;
          rge_domaines: string[] | null;
          tranche_effectif: string | null;
          score: number | null;
          /** RGPD art. 14 : phrase reprise mot pour mot en pied de message. */
          source: string;
          premiere_vue_le: string;
          derniere_vue_le: string;
          sorti_du_rge_le: string | null;
          etat: EtatContact;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          siren: string;
          place_id?: string | null;
          denomination?: string | null;
          nom?: string | null;
          address?: string | null;
          code_postal?: string | null;
          city?: string | null;
          telephone?: string | null;
          telephone_mobile?: boolean | null;
          emails?: string[] | null;
          email_principal?: string | null;
          email_valide?: boolean | null;
          website?: string | null;
          rge_domaines?: string[] | null;
          tranche_effectif?: string | null;
          score?: number | null;
          source: string;
          premiere_vue_le: string;
          derniere_vue_le: string;
          sorti_du_rge_le?: string | null;
          etat?: EtatContact;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };

      /**
       * Journal des échanges, une ligne par échange et dans les DEUX SENS
       * (migration 0057). Remplace les colonnes plates `date_envoi`,
       * `date_relance`, `date_nurturing`, `contact_auto_le` et `reponse`, qui ne
       * savaient représenter ni un second appel, ni le canal d'une réponse.
       */
      contact_echanges: {
        Row: {
          id: string;
          contact_id: string;
          canal: CanalEchange;
          sens: SensEchange;
          nature: NatureEchange;
          issue: IssueEchange | null;
          survenu_le: string;
          /** true = la machine l'a fait ; false = un humain le déclare. */
          automatique: boolean;
          campagne_id: string | null;
          message_id: string | null;
          commentaire: string | null;
          payload: Json;
        };
        Insert: {
          id?: string;
          contact_id: string;
          canal: CanalEchange;
          sens: SensEchange;
          nature: NatureEchange;
          issue?: IssueEchange | null;
          survenu_le?: string;
          automatique?: boolean;
          campagne_id?: string | null;
          message_id?: string | null;
          commentaire?: string | null;
          payload?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["contact_echanges"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "contact_echanges_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * Preuve durable d'une opposition (migration 0057). Ne se purge JAMAIS et
       * survit à la suppression du contact : c'est le seul rempart contre une
       * re-sollicitation au prochain import. Généralise `prospection_suppressions`
       * (e-mail seul) au téléphone et au SIREN, pour qu'un STOP reçu par appel
       * laisse aussi une trace.
       */
      oppositions: {
        Row: {
          type: TypeOpposition;
          valeur: string;
          motif: string;
          created_at: string;
        };
        Insert: {
          type: TypeOpposition;
          valeur: string;
          motif: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["oppositions"]["Insert"]>;
        Relationships: [];
      };

      /**
       * Table de PRÉPARATION de l'annuaire RGE (migration 0057), vidée puis
       * remplie à chaque extraction. Ne jamais y lire un état : la vérité est
       * dans `contacts` une fois `rge_rapprocher()` appelée.
       */
      rge_import: {
        Row: {
          siren: string;
          denomination: string | null;
          nom: string | null;
          address: string | null;
          code_postal: string | null;
          city: string | null;
          telephone: string | null;
          emails: string[] | null;
          website: string | null;
          rge_domaines: string[] | null;
          tranche_effectif: string | null;
          source: string | null;
          importe_le: string;
        };
        Insert: {
          siren: string;
          denomination?: string | null;
          nom?: string | null;
          address?: string | null;
          code_postal?: string | null;
          city?: string | null;
          telephone?: string | null;
          emails?: string[] | null;
          website?: string | null;
          rge_domaines?: string[] | null;
          tranche_effectif?: string | null;
          source?: string | null;
          importe_le?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rge_import"]["Insert"]>;
        Relationships: [];
      };
      dossiers: {
        Row: {
          id: string;
          artisan_id: string | null;
          statut: StatutDossier;
          dispositif: Dispositif;
          type_travaux: string;
          commune: string | null;
          code_postal: string | null;
          statut_rge: string | null;
          client_identifie: boolean;
          montant_estime: number | null;
          dates_json: Json;
          caracteristiques_techniques_json: Json;
          formule: string | null;
          created_at: string;
          delivered_at: string | null;
          vigilance_json: Json | null;
          vigilance_at: string | null;
          /** Dernier passage de l'artisan (migration 0018). null = jamais ouvert. */
          pieces_vues_at: string | null;
          estimated_aid_cents: number | null;
          tier_id: string | null;
          base_price_cents: number | null;
          discount_cents: number;
          credit_applied_cents: number;
          final_price_cents: number | null;
          status: DossierBillingStatus;
          price_locked_at: string | null;
          price_warning: boolean;
          oblige_id: string | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          artisan_id?: string | null;
          statut?: StatutDossier;
          dispositif: Dispositif;
          type_travaux: string;
          commune?: string | null;
          code_postal?: string | null;
          statut_rge?: string | null;
          client_identifie?: boolean;
          montant_estime?: number | null;
          dates_json?: Json;
          caracteristiques_techniques_json?: Json;
          formule?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          vigilance_json?: Json | null;
          vigilance_at?: string | null;
          pieces_vues_at?: string | null;
          estimated_aid_cents?: number | null;
          tier_id?: string | null;
          base_price_cents?: number | null;
          discount_cents?: number;
          credit_applied_cents?: number;
          final_price_cents?: number | null;
          status?: DossierBillingStatus;
          price_locked_at?: string | null;
          price_warning?: boolean;
          oblige_id?: string | null;
          source?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dossiers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dossiers_artisan_id_fkey";
            columns: ["artisan_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dossiers_oblige_id_fkey";
            columns: ["oblige_id"];
            referencedRelation: "obliges";
            referencedColumns: ["id"];
          },
        ];
      };
      obliges: {
        Row: { id: string; nom: string; actif: boolean; exigences_json: Json; source_url: string | null; revue_le: string | null; created_at: string };
        Insert: { id?: string; nom: string; actif?: boolean; exigences_json?: Json; source_url?: string | null; revue_le?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["obliges"]["Insert"]>;
        Relationships: [];
      };
      retours_depot: {
        // `reprise_demandee` est nullable SANS défaut (migration 0051) : NULL
        // signifie « on n'a pas posé la question », jamais « sans reprise ».
        Row: { id: string; dossier_id: string; statut: "en_cours" | "accepte" | "refuse" | "abandonne"; motif: string | null; detail: string | null; reprise_demandee: boolean | null; motif_reprise: string | null; declared_at: string; updated_at: string };
        Insert: { id?: string; dossier_id: string; statut: "en_cours" | "accepte" | "refuse" | "abandonne"; motif?: string | null; detail?: string | null; reprise_demandee?: boolean | null; motif_reprise?: string | null; declared_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["retours_depot"]["Insert"]>;
        Relationships: [{ foreignKeyName: "retours_depot_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] }];
      };
      // --- Mesure du tunnel d'entreprise (migration 0051) ------------------
      evenements_parcours: {
        Row: { id: string; type: TypeEvenementParcours; dossier_id: string | null; artisan_id: string | null; source: string | null; motif: string | null; minutes: number | null; detail_json: Json; created_at: string };
        Insert: { id?: string; type: TypeEvenementParcours; dossier_id?: string | null; artisan_id?: string | null; source?: string | null; motif?: string | null; minutes?: number | null; detail_json?: Json; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["evenements_parcours"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "evenements_parcours_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] },
          { foreignKeyName: "evenements_parcours_artisan_id_fkey"; columns: ["artisan_id"]; referencedRelation: "artisans"; referencedColumns: ["id"] },
        ];
      };
      appels_llm: {
        Row: { id: string; dossier_id: string | null; artisan_id: string | null; contexte: string; modele: string; tokens_entree: number; tokens_sortie: number; cout_micro_usd: number | null; created_at: string };
        Insert: { id?: string; dossier_id?: string | null; artisan_id?: string | null; contexte: string; modele: string; tokens_entree?: number; tokens_sortie?: number; cout_micro_usd?: number | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["appels_llm"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "appels_llm_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] },
          { foreignKeyName: "appels_llm_artisan_id_fkey"; columns: ["artisan_id"]; referencedRelation: "artisans"; referencedColumns: ["id"] },
        ];
      };
      quote_gestures: {
        Row: { id: string; slug: string; label: string; category: string; mpr_eligible: boolean; cee_eligible: boolean; cee_fiche_reference: string | null; active: boolean; valid_from: string; valid_until: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; slug: string; label: string; category: string; mpr_eligible?: boolean; cee_eligible?: boolean; cee_fiche_reference?: string | null; active?: boolean; valid_from?: string; valid_until?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["quote_gestures"]["Insert"]>; Relationships: [];
      };
      quote_gesture_fields: {
        Row: { id: string; gesture_id: string; key: string; label: string; type: "text" | "number" | "boolean"; unit: string | null; required: boolean; min_value: number | null; max_value: number | null; help_text: string | null; position: number; created_at: string };
        Insert: { id?: string; gesture_id: string; key: string; label: string; type: "text" | "number" | "boolean"; unit?: string | null; required?: boolean; min_value?: number | null; max_value?: number | null; help_text?: string | null; position?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["quote_gesture_fields"]["Insert"]>; Relationships: [];
      };
      quote_templates: {
        Row: { id: string; gesture_id: string; version: number; lines: Json; mandatory_mentions: Json; valid_from: string; valid_until: string | null; active: boolean; placeholder: boolean; source_url: string | null; reviewed_by: string | null; reviewed_at: string | null; notes: string | null; created_at: string };
        Insert: { id?: string; gesture_id: string; version: number; lines: Json; mandatory_mentions?: Json; valid_from?: string; valid_until?: string | null; active?: boolean; placeholder?: boolean; source_url?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; notes?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["quote_templates"]["Insert"]>; Relationships: [];
      };
      generated_quotes: {
        Row: { id: string; artisan_id: string; gesture_id: string; dossier_id: string | null; template_version: number; field_values: Json; rendered_lines: Json; created_at: string };
        Insert: { id?: string; artisan_id: string; gesture_id: string; dossier_id?: string | null; template_version: number; field_values: Json; rendered_lines: Json; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["generated_quotes"]["Insert"]>; Relationships: [];
      };
      regles_metier: {
        Row: {
          id: string;
          dispositif: Dispositif;
          type_travaux: string;
          condition_json: Json;
          pieces_requises_json: Json;
          points_vigilance_json: Json;
          version_formulaire: string | null;
          version: number;
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          dispositif: Dispositif;
          type_travaux: string;
          condition_json?: Json;
          pieces_requises_json?: Json;
          points_vigilance_json?: Json;
          version_formulaire?: string | null;
          version?: number;
          actif?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["regles_metier"]["Insert"]>;
        Relationships: [];
      };
      paiements: {
        Row: {
          id: string;
          dossier_id: string | null;
          artisan_id: string | null;
          stripe_id: string | null;
          montant: number | null;
          statut: StatutPaiement;
          type: TypePaiement;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id?: string | null;
          artisan_id?: string | null;
          stripe_id?: string | null;
          montant?: number | null;
          statut?: StatutPaiement;
          type: TypePaiement;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["paiements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "paiements_dossier_id_fkey";
            columns: ["dossier_id"];
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paiements_artisan_id_fkey";
            columns: ["artisan_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
        ];
      };
      factures: {
        Row: {
          id: string;
          numero: string;
          annee: number;
          rang: number;
          paiement_id: string;
          artisan_id: string | null;
          dossier_id: string | null;
          emise_le: string;
          acheteur_json: Json;
          lignes_json: Json;
          total_ht_cents: number;
          tva_taux: number;
          total_tva_cents: number;
          total_ttc_cents: number;
          mention_tva: string;
        };
        // Écriture réservée à `emettre_facture` (SQL). Aucun insert direct.
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "factures_paiement_id_fkey";
            columns: ["paiement_id"];
            referencedRelation: "paiements";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          email: string;
          nom: string | null;
          entreprise: string | null;
          telephone: string | null;
          message: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nom?: string | null;
          entreprise?: string | null;
          telephone?: string | null;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      /**
       * Taxonomie des motifs de refus (migration 0053, contenu seedé en 0054).
       * RLS sans policy : lue au build par le service-role, comme `regles_metier`
       * l'est par `gestes-loader.ts`. Aucun accès `anon`.
       */
      refus_motifs: {
        Row: {
          id: string;
          slug: string;
          libelle: string;
          aide: AideRefus;
          description: string;
          contestable: boolean;
          publie: boolean;
          meta_title: string;
          meta_description: string;
          contenu_json: ContenuMotifRefus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          libelle: string;
          aide: AideRefus;
          description: string;
          contestable?: boolean;
          publie?: boolean;
          meta_title: string;
          meta_description: string;
          contenu_json?: ContenuMotifRefus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["refus_motifs"]["Insert"]>;
        Relationships: [];
      };
      /**
       * Demandes de diagnostic du cluster « refus » (migration 0053).
       * RLS sans policy : service-role uniquement, comme `leads`.
       */
      refus_demandes: {
        Row: {
          id: string;
          profil: ProfilRefus;
          aide: AideRefus | null;
          geste: string | null;
          email: string;
          telephone: string | null;
          /** Déclarée, jamais calculée : aucun compte à rebours n'en est dérivé. */
          date_notification: string | null;
          motif_libre: string | null;
          statut: StatutDemandeRefus;
          consentement_contact_at: string | null;
          consentements_version: string | null;
          /** Instantané du texte exact affiché au moment du consentement. */
          consentements_texte: Json;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          diagnostic: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profil: ProfilRefus;
          aide?: AideRefus | null;
          geste?: string | null;
          email: string;
          telephone?: string | null;
          date_notification?: string | null;
          motif_libre?: string | null;
          statut?: StatutDemandeRefus;
          consentement_contact_at?: string | null;
          consentements_version?: string | null;
          consentements_texte?: Json;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          diagnostic?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["refus_demandes"]["Insert"]>;
        Relationships: [];
      };
      pieces_justificatives: {
        Row: {
          id: string;
          dossier_id: string;
          type: TypePiece;
          storage_path: string;
          nom_fichier: string | null;
          mime: string | null;
          taille: number | null;
          extraction_json: Json;
          extraction_statut: StatutExtraction;
          extraction_erreur: string | null;
          /** Mentions obligatoires relevées sur la pièce. null = non vérifié. */
          mentions_json: Json | null;
          deposant: Deposant;
          validation_status: StatutValidationPiece | null;
          rejection_reason: string | null;
          reviewed_at: string | null;
          created_at: string;
          extracted_at: string | null;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          type: TypePiece;
          storage_path: string;
          nom_fichier?: string | null;
          mime?: string | null;
          taille?: number | null;
          extraction_json?: Json;
          extraction_statut?: StatutExtraction;
          extraction_erreur?: string | null;
          mentions_json?: Json | null;
          deposant?: Deposant;
          validation_status?: StatutValidationPiece | null;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          extracted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["pieces_justificatives"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "pieces_justificatives_dossier_id_fkey";
            columns: ["dossier_id"];
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
        ];
      };
      liens_depot: {
        Row: {
          id: string;
          dossier_id: string;
          /** SHA-256 du token. Le token en clair n'est jamais stocké. */
          token_hash: string;
          /**
           * Aléa entrant dans la dérivation du token (migration 0041). Neuf à
           * chaque nouveau lien : c'est lui qui rend la révocation définitive.
           * NULL = lien v1 historique, résoluble mais non réaffichable.
           */
          token_nonce: string | null;
          expire_at: string;
          revoque_at: string | null;
          derniere_visite_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          token_hash: string;
          token_nonce?: string | null;
          expire_at: string;
          revoque_at?: string | null;
          derniere_visite_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["liens_depot"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "liens_depot_dossier_id_fkey";
            columns: ["dossier_id"];
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
        ];
      };
      reminder_schedules: {
        Row: { id: string; dossier_id: string; enabled: boolean; enabled_at: string | null; channels: Json; cadence_days: Json; max_reminders: number; opt_out_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; dossier_id: string; enabled?: boolean; enabled_at?: string | null; channels?: Json; cadence_days?: Json; max_reminders?: number; opt_out_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reminder_schedules"]["Insert"]>;
        Relationships: [{ foreignKeyName: "reminder_schedules_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] }];
      };
      reminder_logs: {
        Row: { id: string; dossier_id: string; cadence_step: number; document_types: Json; channel: "email" | "sms" | "manual"; status: "queued" | "sent" | "delivered" | "bounced" | "failed" | "skipped"; sent_at: string | null; opened_at: string | null; clicked_at: string | null; provider_message_id: string | null; error_detail: string | null; created_at: string };
        Insert: { id?: string; dossier_id: string; cadence_step: number; document_types?: Json; channel: "email" | "sms" | "manual"; status: "queued" | "sent" | "delivered" | "bounced" | "failed" | "skipped"; sent_at?: string | null; opened_at?: string | null; clicked_at?: string | null; provider_message_id?: string | null; error_detail?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["reminder_logs"]["Insert"]>;
        Relationships: [{ foreignKeyName: "reminder_logs_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] }];
      };
      user_quote_templates: {
        Row: { id: string; artisan_id: string; gesture_id: string; name: string; field_values: Json; created_at: string };
        Insert: { id?: string; artisan_id: string; gesture_id: string; name: string; field_values?: Json; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["user_quote_templates"]["Insert"]>;
        Relationships: [];
      };
      plafonds_ressources: {
        Row: {
          id: string;
          annee: number;
          zone: "idf" | "hors_idf";
          /** 0 = incrément par personne supplémentaire au-delà de 5. */
          personnes: number;
          plafond_grande_precarite: number;
          plafond_precaire: number;
          /**
           * Plafond du profil « intermédiaire » (violet). Sa borne haute sépare le
           * violet (éligible MPR par geste) du rose (non éligible en 2026). `null`
           * pour un barème antérieur à la migration 0044. Ne concerne que MPR.
           */
          plafond_intermediaire: number | null;
          actif: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      pricing_tiers: {
        Row: {
          id: string;
          name: string;
          aid_min_cents: number;
          aid_max_cents: number | null;
          price_cents: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          aid_min_cents: number;
          aid_max_cents?: number | null;
          price_cents: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pricing_tiers"]["Insert"]>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referee_id: string;
          code_used: string;
          status: ReferralStatus;
          referee_first_dossier_id: string | null;
          rewarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referee_id: string;
          code_used: string;
          status?: ReferralStatus;
          referee_first_dossier_id?: string | null;
          rewarded_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey";
            columns: ["referrer_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referee_id_fkey";
            columns: ["referee_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_credits: {
        Row: {
          id: string;
          artisan_id: string;
          amount_cents: number;
          source_referral_id: string | null;
          issued_at: string;
          expires_at: string;
          consumed_cents: number;
          status: ReferralCreditStatus;
        };
        Insert: {
          id?: string;
          artisan_id: string;
          amount_cents: number;
          source_referral_id?: string | null;
          issued_at?: string;
          expires_at: string;
          consumed_cents?: number;
          status?: ReferralCreditStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["referral_credits"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "referral_credits_artisan_id_fkey";
            columns: ["artisan_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_credits_source_referral_id_fkey";
            columns: ["source_referral_id"];
            referencedRelation: "referrals";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_applications: {
        Row: {
          id: string;
          credit_id: string;
          dossier_id: string;
          amount_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          credit_id: string;
          dossier_id: string;
          amount_cents: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["credit_applications"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "credit_applications_credit_id_fkey";
            columns: ["credit_id"];
            referencedRelation: "referral_credits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_applications_dossier_id_fkey";
            columns: ["dossier_id"];
            referencedRelation: "dossiers";
            referencedColumns: ["id"];
          },
        ];
      };
      prospection_campagnes: {
        Row: {
          id: string;
          nom: string;
          from_email: string;
          objet: string;
          corps: string;
          demarre_le: string;
          termine_le: string;
          daily_cap_max: number;
          en_pause: boolean;
          motif_pause: string | null;
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          from_email: string;
          objet: string;
          corps: string;
          demarre_le: string;
          termine_le: string;
          daily_cap_max?: number;
          en_pause?: boolean;
          motif_pause?: string | null;
          actif?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["prospection_campagnes"]["Insert"]
        >;
        Relationships: [];
      };
      prospects: {
        Row: {
          id: string;
          email: string;
          prenom: string | null;
          nom: string | null;
          entreprise: string | null;
          ville: string | null;
          code_postal: string | null;
          /** D'où vient l'adresse. Repris dans le pied du message (RGPD art. 14). */
          source: string;
          statut: StatutProspect;
          unsubscribe_token: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          prenom?: string | null;
          nom?: string | null;
          entreprise?: string | null;
          ville?: string | null;
          code_postal?: string | null;
          source: string;
          statut?: StatutProspect;
          unsubscribe_token?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospects"]["Insert"]>;
        Relationships: [];
      };
      prospection_messages: {
        Row: {
          id: string;
          campagne_id: string;
          prospect_id: string;
          statut: StatutMessageProspection;
          objet: string;
          corps: string;
          scheduled_on: string;
          sent_at: string | null;
          erreur: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campagne_id: string;
          prospect_id: string;
          statut?: StatutMessageProspection;
          objet: string;
          corps: string;
          scheduled_on: string;
          sent_at?: string | null;
          erreur?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["prospection_messages"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "prospection_messages_prospect_id_fkey";
            columns: ["prospect_id"];
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      prospection_evenements: {
        Row: {
          id: string;
          prospect_id: string | null;
          type: TypeEvenementProspection;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id?: string | null;
          type: TypeEvenementProspection;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["prospection_evenements"]["Insert"]
        >;
        Relationships: [];
      };
      prospection_suppressions: {
        Row: { email: string; motif: string; created_at: string };
        Insert: { email: string; motif: string; created_at?: string };
        Update: Partial<
          Database["public"]["Tables"]["prospection_suppressions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      /**
       * Une ligne par contact, avec son historique agrégé (migration 0057).
       * `a_relancer` et `jours_depuis_contact` sont calculés À LA LECTURE : ils
       * dépendent du jour où on regarde, donc ils ne peuvent pas être stockés
       * sans être périmés le lendemain.
       */
      contacts_synthese: {
        Row: Database["public"]["Tables"]["contacts"]["Row"] & {
          dernier_contact_le: string | null;
          nb_sollicitations: number;
          canaux_utilises: CanalEchange[] | null;
          repondu_le: string | null;
          /** Canal sur lequel le contact a répondu, pas celui sur lequel on l'a sollicité. */
          canal_de_reponse: CanalEchange | null;
          joignable_whatsapp: boolean | null;
          joignable_email: boolean | null;
          /** Canal du dernier contact sortant : celui qu'on ne veut pas répéter. */
          dernier_canal: CanalEchange | null;
          nb_reponses: number;
          nb_appels: number;
          a_relancer: boolean | null;
          jours_depuis_contact: number | null;
        };
        Relationships: [];
      };
      /**
       * Performance par canal (migration 0057). `taux_reponse` est NULL tant
       * qu'aucun envoi n'est parti : on n'affiche pas un pourcentage calculé sur
       * rien, même règle que `prixPack` qui rend « — » plutôt qu'un chiffre inventé.
       */
      stats_canal: {
        Row: {
          canal: CanalEchange;
          touches: number;
          repondeurs: number;
          stops: number;
          premiers: number;
          relances: number;
          ouvreurs: number;
          taux_reponse: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      prospection_desinscrire: {
        Args: { p_email: string; p_motif: string };
        Returns: undefined;
      };
      /**
       * Rapproche `rge_import` et `contacts` sur le SIREN. Lève si `rge_import`
       * est vide : un import vide marquerait les 3 293 contacts « sortis du RGE »
       * d'un coup.
       */
      rge_rapprocher: {
        Args: { p_jour?: string | null };
        Returns: { nouveaux: number; revus: number; disparus: number }[];
      };
      /** Recalcul de masse de `contacts.etat`. Rattrapage, les triggers font le reste. */
      contacts_rafraichir_etats: {
        Args: Record<string, never>;
        Returns: number;
      };
      consume_auth_rate_limit: {
        Args: {
          p_action: string;
          p_key_hash: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      price_dossier: {
        Args: { p_dossier_id: string; p_estimated_aid_cents?: number | null };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      apply_referral_code: {
        Args: { p_referee_id: string; p_code: string };
        Returns: Database["public"]["Tables"]["referrals"]["Row"];
      };
      claim_referee_discount: {
        Args: { p_dossier_id: string };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      apply_credits_to_dossier: {
        Args: { p_dossier_id: string };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      confirm_dossier_payment: {
        Args: { p_dossier_id: string };
        Returns: Database["public"]["Tables"]["dossiers"]["Row"];
      };
      expire_old_credits: {
        Args: Record<string, never>;
        Returns: number;
      };
      refresh_credit_balance: {
        Args: { p_artisan_id: string };
        Returns: undefined;
      };
      emettre_facture: {
        Args: {
          p_paiement_id: string;
          p_tva_taux: number;
          p_mention_tva: string;
        };
        Returns: Database["public"]["Tables"]["factures"]["Row"];
      };
    };
    Enums: {
      statut_dossier: StatutDossier;
      dispositif: Dispositif;
      statut_abonnement: StatutAbonnement;
      type_paiement: TypePaiement;
      statut_paiement: StatutPaiement;
      type_piece: TypePiece;
      statut_extraction: StatutExtraction;
      dossier_billing_status: DossierBillingStatus;
      referral_status: ReferralStatus;
      referral_credit_status: ReferralCreditStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row aliases. */
export type Artisan = Database["public"]["Tables"]["artisans"]["Row"];
export type Dossier = Database["public"]["Tables"]["dossiers"]["Row"];
export type Oblige = Database["public"]["Tables"]["obliges"]["Row"];
export type RetourDepot = Database["public"]["Tables"]["retours_depot"]["Row"];
export type EvenementParcours =
  Database["public"]["Tables"]["evenements_parcours"]["Row"];
export type AppelLlm = Database["public"]["Tables"]["appels_llm"]["Row"];
export type RegleMetier = Database["public"]["Tables"]["regles_metier"]["Row"];
export type Paiement = Database["public"]["Tables"]["paiements"]["Row"];
export type Facture = Database["public"]["Tables"]["factures"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type RefusMotif = Database["public"]["Tables"]["refus_motifs"]["Row"];
export type RefusDemande = Database["public"]["Tables"]["refus_demandes"]["Row"];
export type PieceJustificative =
  Database["public"]["Tables"]["pieces_justificatives"]["Row"];
export type LienDepot = Database["public"]["Tables"]["liens_depot"]["Row"];
export type PlafondRessources =
  Database["public"]["Tables"]["plafonds_ressources"]["Row"];
export type PricingTier = Database["public"]["Tables"]["pricing_tiers"]["Row"];
export type Referral = Database["public"]["Tables"]["referrals"]["Row"];
export type ReferralCredit =
  Database["public"]["Tables"]["referral_credits"]["Row"];
export type CreditApplication =
  Database["public"]["Tables"]["credit_applications"]["Row"];
export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type CampagneProspection =
  Database["public"]["Tables"]["prospection_campagnes"]["Row"];
export type MessageProspection =
  Database["public"]["Tables"]["prospection_messages"]["Row"];
