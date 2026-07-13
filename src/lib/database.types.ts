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
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["artisans"]["Insert"]>;
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
        Row: { id: string; dossier_id: string; statut: "en_cours" | "accepte" | "refuse" | "abandonne"; motif: string | null; detail: string | null; declared_at: string; updated_at: string };
        Insert: { id?: string; dossier_id: string; statut: "en_cours" | "accepte" | "refuse" | "abandonne"; motif?: string | null; detail?: string | null; declared_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["retours_depot"]["Insert"]>;
        Relationships: [{ foreignKeyName: "retours_depot_dossier_id_fkey"; columns: ["dossier_id"]; referencedRelation: "dossiers"; referencedColumns: ["id"] }];
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
          expire_at: string;
          revoque_at: string | null;
          derniere_visite_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dossier_id: string;
          token_hash: string;
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
      plafonds_ressources: {
        Row: {
          id: string;
          annee: number;
          zone: "idf" | "hors_idf";
          /** 0 = incrément par personne supplémentaire au-delà de 5. */
          personnes: number;
          plafond_grande_precarite: number;
          plafond_precaire: number;
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
    };
    Views: Record<string, never>;
    Functions: {
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
export type RegleMetier = Database["public"]["Tables"]["regles_metier"]["Row"];
export type Paiement = Database["public"]["Tables"]["paiements"]["Row"];
export type Facture = Database["public"]["Tables"]["factures"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
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
