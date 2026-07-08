"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createDossierCeeIsolation } from "@/lib/dossier/actions";
import {
  LOGEMENT_TYPES,
  OCCUPATIONS,
  PRECARITES,
  RESIDENCES,
  TYPES_ISOLATION,
  ceeIsolationDefaults,
  ceeIsolationSchema,
  type CeeIsolationInput,
} from "@/lib/dossier/cee-isolation";
import { Section, SelectField, TextField } from "@/components/dossier/fields";

const isolationOptions = Object.fromEntries(
  Object.entries(TYPES_ISOLATION).map(([k, v]) => [k, `${v.label} — ${v.fiche}`]),
) as Record<string, string>;

export function DossierCeeIsolationForm({
  initialValues,
}: {
  initialValues?: Partial<CeeIsolationInput>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CeeIsolationInput>({
    resolver: zodResolver(ceeIsolationSchema),
    // Le profil artisan connecté préremplit les champs entreprise / RGE.
    defaultValues: { ...ceeIsolationDefaults, ...initialValues },
    mode: "onBlur",
  });

  const typeIsolation = watch("type_isolation");
  const rMin = typeIsolation ? TYPES_ISOLATION[typeIsolation]?.r_min : undefined;

  async function onSubmit(values: CeeIsolationInput) {
    setServerError(null);
    const result = await createDossierCeeIsolation(values);

    if (result.ok) {
      router.push(`/dossiers/${result.dossierId}`);
      return;
    }

    setServerError(result.error);
    if (result.fieldErrors) {
      for (const [name, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          setError(name as keyof CeeIsolationInput, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Section
        title="Entreprise (artisan RGE)"
        description="Ces informations alimentent le pack et le contrôle de qualification RGE."
      >
        <TextField label="Raison sociale" required error={errors.entreprise} register={register("entreprise")} />
        <TextField label="SIRET" required placeholder="14 chiffres" inputMode="numeric" error={errors.siret} register={register("siret")} />
        <TextField label="N° de qualification RGE" required error={errors.rge_numero} register={register("rge_numero")} />
        <TextField label="Domaine RGE" required placeholder="Ex. Qualibat 7131 – Isolation thermique" error={errors.rge_domaine} register={register("rge_domaine")} />
        <TextField label="RGE valide à partir du" type="date" error={errors.rge_date_debut} register={register("rge_date_debut")} />
        <TextField label="RGE valide jusqu'au" required type="date" error={errors.rge_date_fin} register={register("rge_date_fin")} />
        <TextField label="Nom du signataire" required error={errors.signataire_nom} register={register("signataire_nom")} />
        <TextField label="Prénom du signataire" required error={errors.signataire_prenom} register={register("signataire_prenom")} />
        <TextField label="Email" required type="email" error={errors.email} register={register("email")} />
        <TextField label="Téléphone" error={errors.telephone} register={register("telephone")} />
      </Section>

      <Section
        title="Bénéficiaire (client)"
        description="Le ménage bénéficiaire des travaux et de la prime."
      >
        <TextField label="Nom" required error={errors.client_nom} register={register("client_nom")} />
        <TextField label="Prénom" required error={errors.client_prenom} register={register("client_prenom")} />
        <TextField label="Adresse du chantier" required error={errors.client_adresse} register={register("client_adresse")} />
        <TextField label="Code postal" required placeholder="5 chiffres" inputMode="numeric" error={errors.client_code_postal} register={register("client_code_postal")} />
        <TextField label="Commune" required error={errors.client_commune} register={register("client_commune")} />
        <TextField label="Email du client" type="email" error={errors.client_email} register={register("client_email")} />
        <TextField label="Téléphone du client" error={errors.client_telephone} register={register("client_telephone")} />
        <SelectField label="Statut d'occupation" required options={OCCUPATIONS} error={errors.occupation} register={register("occupation")} />
        <SelectField label="Catégorie de revenus" required options={PRECARITES} hint="Détermine la bonification CEE (Coup de pouce)." error={errors.precarite} register={register("precarite")} />
      </Section>

      <Section title="Logement">
        <SelectField label="Type de logement" required options={LOGEMENT_TYPES} error={errors.logement_type} register={register("logement_type")} />
        <TextField label="Année de construction" required type="number" inputMode="numeric" hint="Le logement doit être achevé depuis plus de 2 ans (CEE)." error={errors.logement_annee_construction} register={register("logement_annee_construction")} />
        <SelectField label="Usage" required options={RESIDENCES} error={errors.logement_residence} register={register("logement_residence")} />
        <TextField label="Surface habitable (m²)" type="number" step="0.01" inputMode="decimal" error={errors.logement_surface_habitable} register={register("logement_surface_habitable")} />
      </Section>

      <Section
        title="Travaux d'isolation"
        description="Caractéristiques techniques du poste isolé."
      >
        <SelectField label="Type d'isolation" required options={isolationOptions} error={errors.type_isolation} register={register("type_isolation")} />
        <TextField label="Surface isolée (m²)" required type="number" step="0.01" inputMode="decimal" error={errors.surface_isolee_m2} register={register("surface_isolee_m2")} />
        <TextField label="Type d'isolant" required placeholder="Ex. laine de verre soufflée" error={errors.isolant_type} register={register("isolant_type")} />
        <TextField
          label="Résistance thermique R (m²·K/W)"
          required
          type="number"
          step="0.01"
          inputMode="decimal"
          hint={rMin ? `R minimal indicatif pour ce poste : ≥ ${rMin}` : undefined}
          error={errors.resistance_thermique_r}
          register={register("resistance_thermique_r")}
        />
        <TextField label="Marque de l'isolant" error={errors.isolant_marque} register={register("isolant_marque")} />
        <TextField label="Référence produit" error={errors.isolant_reference} register={register("isolant_reference")} />
        <TextField label="Épaisseur (mm)" type="number" inputMode="numeric" error={errors.epaisseur_mm} register={register("epaisseur_mm")} />
      </Section>

      <Section
        title="Chronologie"
        description="L'ordre des dates conditionne l'éligibilité — cœur du contrôle anti-refus."
      >
        <TextField label="Date de visite technique" type="date" error={errors.date_visite_technique} register={register("date_visite_technique")} />
        <TextField label="Date du devis signé" required type="date" hint="Doit précéder le début des travaux." error={errors.date_devis} register={register("date_devis")} />
        <TextField label="Date de début des travaux" type="date" error={errors.date_debut_travaux} register={register("date_debut_travaux")} />
        <TextField label="Date de fin des travaux" type="date" error={errors.date_fin_travaux} register={register("date_fin_travaux")} />
        <TextField label="Date de la facture" type="date" error={errors.date_facture} register={register("date_facture")} />
      </Section>

      <Section title="Montants">
        <TextField label="Montant HT (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ht} register={register("montant_ht")} />
        <TextField label="Montant TTC (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ttc} register={register("montant_ttc")} />
        <TextField label="Prime CEE estimée (€)" type="number" step="0.01" inputMode="decimal" error={errors.montant_prime_estime} register={register("montant_prime_estime")} />
        <TextField label="Aides publiques hors CEE (€) — ex. MaPrimeRénov'" type="number" step="0.01" inputMode="decimal" error={errors.montant_aides_publiques} register={register("montant_aides_publiques")} />
      </Section>

      {serverError && (
        <div className="rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
          {serverError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pb-12">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Création…" : "Créer le dossier"}
        </button>
      </div>
    </form>
  );
}
