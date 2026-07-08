/**
 * Database types for the Dossimo Supabase schema.
 *
 * Hand-written to match the data model in CLAUDE.md §7. Once the schema lives
 * in Supabase, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type StatutDossier = "nouveau" | "en_traitement" | "livre";
export type Dispositif = "maprimerenov" | "cee";
export type StatutAbonnement = "aucun" | "actif" | "expire";
export type TypePaiement = "abonnement" | "ponctuel";
export type StatutPaiement = "en_attente" | "paye" | "echoue" | "rembourse";
export type TypePiece = "devis" | "facture" | "autre";
export type StatutExtraction = "en_attente" | "ok" | "echec";

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
          ville: string | null;
          siret: string | null;
          qualification_rge: string | null;
          statut_abonnement: StatutAbonnement;
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
          ville?: string | null;
          siret?: string | null;
          qualification_rge?: string | null;
          statut_abonnement?: StatutAbonnement;
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
        };
        Update: Partial<Database["public"]["Tables"]["dossiers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dossiers_artisan_id_fkey";
            columns: ["artisan_id"];
            referencedRelation: "artisans";
            referencedColumns: ["id"];
          },
        ];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      statut_dossier: StatutDossier;
      dispositif: Dispositif;
      statut_abonnement: StatutAbonnement;
      type_paiement: TypePaiement;
      statut_paiement: StatutPaiement;
      type_piece: TypePiece;
      statut_extraction: StatutExtraction;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row aliases. */
export type Artisan = Database["public"]["Tables"]["artisans"]["Row"];
export type Dossier = Database["public"]["Tables"]["dossiers"]["Row"];
export type RegleMetier = Database["public"]["Tables"]["regles_metier"]["Row"];
export type Paiement = Database["public"]["Tables"]["paiements"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type PieceJustificative =
  Database["public"]["Tables"]["pieces_justificatives"]["Row"];
