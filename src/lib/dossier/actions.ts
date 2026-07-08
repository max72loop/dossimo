"use server";

import { createClient } from "@/lib/supabase/server";
import { TYPES_CET, TYPES_ISOLATION, TYPES_PAC, ceeIsolationSchema } from "@/lib/dossier/cee-isolation";

export type CreateDossierResult =
  | { ok: true; dossierId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Crée un dossier CEE isolation à partir de la saisie unique.
 *
 * L'artisan est déduit de l'utilisateur connecté (`auth.uid()` → fiche artisan),
 * jamais du formulaire. Écriture via le client auth-scopé : la RLS garantit
 * qu'un dossier ne peut être rattaché qu'à la propre fiche de l'artisan.
 */
export async function createDossierCeeIsolation(
  input: unknown,
): Promise<CreateDossierResult> {
  const parsed = ceeIsolationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Certains champs sont invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;
  const supabase = await createClient();

  // --- 1. Artisan : l'utilisateur connecté ---
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Vous devez être connecté pour créer un dossier." };
  }

  const { data: artisan, error: artisanErr } = await supabase
    .from("artisans")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (artisanErr || !artisan) {
    return {
      ok: false,
      error: "Profil artisan introuvable. Reconnectez-vous.",
    };
  }

  const artisanId = artisan.id;

  // Synchronise la fiche artisan avec les informations RGE de la saisie
  // (best-effort : n'empêche pas la création du dossier).
  await supabase
    .from("artisans")
    .update({
      entreprise: d.entreprise,
      nom: d.signataire_nom,
      prenom: d.signataire_prenom,
      telephone: d.telephone || null,
      siret: d.siret,
      qualification_rge: d.rge_numero,
    })
    .eq("id", artisanId);

  // --- 2. Dossier : mapping de la saisie unique (par famille de geste) ---
  let fiche: string;
  let typeTravaux: string;
  let blocTechnique: Record<string, unknown>;
  if (d.geste === "pac_air_eau") {
    fiche = TYPES_PAC.air_eau.fiche;
    typeTravaux = "pac_air_eau";
    blocTechnique = {
      pac: {
        type_pac: "air_eau",
        fiche,
        etas: d.pac_etas,
        puissance_kw: d.pac_puissance_kw,
        temperature: d.pac_temperature,
        marque: d.pac_marque || null,
        reference: d.pac_reference || null,
        regulateur_classe: d.pac_regulateur_classe || null,
      },
    };
  } else if (d.geste === "cet") {
    fiche = TYPES_CET.accumulation.fiche;
    typeTravaux = "cet";
    blocTechnique = {
      cet: {
        type_cet: "accumulation",
        fiche,
        cop: d.cet_cop,
        profil_soutirage: d.cet_profil_soutirage,
        volume_l: d.cet_volume_l,
        marque: d.cet_marque || null,
        reference: d.cet_reference || null,
      },
    };
  } else {
    fiche = TYPES_ISOLATION[d.type_isolation!].fiche;
    typeTravaux = d.type_isolation as string;
    blocTechnique = {
      travaux: {
        type_isolation: d.type_isolation,
        fiche,
        surface_isolee_m2: d.surface_isolee_m2,
        isolant_type: d.isolant_type,
        isolant_marque: d.isolant_marque || null,
        isolant_reference: d.isolant_reference || null,
        resistance_thermique_r: d.resistance_thermique_r,
        epaisseur_mm: d.epaisseur_mm ?? null,
      },
    };
  }

  const { data: dossier, error: dossierErr } = await supabase
    .from("dossiers")
    .insert({
      artisan_id: artisanId,
      statut: "nouveau",
      dispositif: d.dispositif,
      type_travaux: typeTravaux,
      commune: d.client_commune,
      code_postal: d.client_code_postal,
      statut_rge: d.rge_numero,
      client_identifie: true,
      montant_estime: d.montant_prime_estime ?? null,
      dates_json: {
        visite_technique: d.date_visite_technique ?? null,
        devis: d.date_devis,
        debut_travaux: d.date_debut_travaux ?? null,
        fin_travaux: d.date_fin_travaux ?? null,
        facture: d.date_facture ?? null,
      },
      caracteristiques_techniques_json: {
        geste: d.geste,
        fiche,
        beneficiaire: {
          nom: d.client_nom,
          prenom: d.client_prenom,
          adresse: d.client_adresse,
          code_postal: d.client_code_postal,
          commune: d.client_commune,
          email: d.client_email ?? null,
          telephone: d.client_telephone || null,
          occupation: d.occupation,
          precarite: d.precarite,
        },
        logement: {
          type: d.logement_type,
          annee_construction: d.logement_annee_construction,
          residence: d.logement_residence,
          surface_habitable: d.logement_surface_habitable ?? null,
        },
        ...blocTechnique,
        montants: {
          ht: d.montant_ht,
          ttc: d.montant_ttc,
          prime_estime: d.montant_prime_estime ?? null,
          aides_publiques_hors_cee: d.montant_aides_publiques ?? null,
        },
        rge: {
          numero: d.rge_numero,
          domaine: d.rge_domaine,
          date_debut: d.rge_date_debut ?? null,
          date_fin: d.rge_date_fin,
        },
      },
      formule: null,
    })
    .select("id")
    .single();

  if (dossierErr || !dossier) {
    return {
      ok: false,
      error: `Erreur base (dossier) : ${dossierErr?.message ?? "inconnue"}`,
    };
  }

  return { ok: true, dossierId: dossier.id };
}
