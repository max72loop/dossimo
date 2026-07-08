"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
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
  Object.entries(TYPES_ISOLATION).map(([k, v]) => [k, `${v.label} · ${v.fiche}`]),
) as Record<string, string>;

type Champ = Path<CeeIsolationInput>;

const ETAPES: { titre: string; champs: Champ[] }[] = [
  { titre: "Dispositif", champs: ["dispositif", "geste"] },
  {
    titre: "Entreprise",
    champs: [
      "entreprise", "siret", "rge_numero", "rge_domaine", "rge_date_debut",
      "rge_date_fin", "signataire_nom", "signataire_prenom", "email", "telephone",
    ],
  },
  {
    titre: "Bénéficiaire",
    champs: [
      "client_nom", "client_prenom", "client_adresse", "client_code_postal",
      "client_commune", "client_email", "client_telephone", "occupation", "precarite",
    ],
  },
  {
    titre: "Logement",
    champs: ["logement_type", "logement_annee_construction", "logement_residence", "logement_surface_habitable"],
  },
  {
    titre: "Travaux",
    champs: [
      "type_isolation", "surface_isolee_m2", "isolant_type", "resistance_thermique_r",
      "isolant_marque", "isolant_reference", "epaisseur_mm",
      "pac_etas", "pac_puissance_kw", "pac_temperature", "pac_marque",
      "pac_reference", "pac_regulateur_classe",
      "cet_cop", "cet_profil_soutirage", "cet_volume_l", "cet_marque", "cet_reference",
    ],
  },
  {
    titre: "Dates & montants",
    champs: [
      "date_visite_technique", "date_devis", "date_debut_travaux", "date_fin_travaux",
      "date_facture", "montant_ht", "montant_ttc", "montant_prime_estime", "montant_aides_publiques",
    ],
  },
];

export function DossierCeeIsolationForm({
  initialValues,
}: {
  initialValues?: Partial<CeeIsolationInput>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [etape, setEtape] = useState(0);
  const [maxEtape, setMaxEtape] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CeeIsolationInput>({
    resolver: zodResolver(ceeIsolationSchema),
    defaultValues: { ...ceeIsolationDefaults, ...initialValues },
    mode: "onBlur",
  });

  const dernier = etape === ETAPES.length - 1;
  const typeIsolation = watch("type_isolation");
  const rMin = typeIsolation ? TYPES_ISOLATION[typeIsolation]?.r_min : undefined;
  const dispositif = watch("dispositif");
  const geste = watch("geste");
  const estPac = geste === "pac_air_eau";
  const estCet = geste === "cet";

  async function suivant() {
    const ok = await trigger(ETAPES[etape].champs);
    if (!ok) return;
    const n = Math.min(etape + 1, ETAPES.length - 1);
    setEtape(n);
    setMaxEtape((m) => Math.max(m, n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function aller(i: number) {
    if (i <= maxEtape) setEtape(i);
  }

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
          setError(name as keyof CeeIsolationInput, { type: "server", message: messages[0] });
        }
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    // Sur les étapes intermédiaires, « Entrée » passe à la suivante (pas de submit).
    const cible = e.target as HTMLElement;
    if (e.key === "Enter" && !dernier && cible.tagName !== "TEXTAREA") {
      e.preventDefault();
      void suivant();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onKeyDown} className="pb-16" noValidate>
      {/* Progression */}
      <div className="mb-8">
        <div className="mb-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {ETAPES.map((s, i) => {
            const fait = i < etape;
            const actif = i === etape;
            const accessible = i <= maxEtape;
            return (
              <button
                key={s.titre}
                type="button"
                onClick={() => aller(i)}
                disabled={!accessible}
                title={s.titre}
                className={`flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                  actif
                    ? "bg-encre text-papier"
                    : fait
                      ? "bg-papier-fonce text-encre hover:bg-filigrane"
                      : "border border-filigrane text-encre-claire"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    actif ? "bg-papier text-encre" : fait ? "bg-succes text-blanc-casse" : "bg-papier-fonce text-ardoise"
                  }`}
                >
                  {fait ? "✓" : i + 1}
                </span>
                <span className="truncate">{s.titre}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-papier-fonce">
          <div
            className="h-full rounded-full bg-tampon transition-all duration-300"
            style={{ width: `${((etape + 1) / ETAPES.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-encre-claire">
          Étape {etape + 1} sur {ETAPES.length}
        </p>
      </div>

      {/* Contenu de l'étape (une partie à la fois) */}
      <div key={etape} className="animate-step">
        {etape === 0 && (
          <Section
            title="Dispositif visé"
            description={
              dispositif === "maprimerenov"
                ? "MaPrimeRénov' · dépôt en ligne par le client sur maprimerenov.gouv.fr. Logement achevé depuis plus de 15 ans. En 2026, l'isolation des murs n'est plus éligible au parcours par geste."
                : "CEE · dossier remis à un obligé. Logement achevé depuis plus de 2 ans."
            }
          >
            <SelectField
              label="Dispositif"
              required
              options={{ cee: "CEE (Certificats d'économies d'énergie)", maprimerenov: "MaPrimeRénov'" }}
              error={errors.dispositif}
              register={register("dispositif")}
            />
            <SelectField
              label="Type de geste"
              required
              options={{ isolation: "Isolation", pac_air_eau: "Pompe à chaleur air/eau", cet: "Chauffe-eau thermodynamique" }}
              hint="Détermine les caractéristiques techniques demandées."
              error={errors.geste}
              register={register("geste")}
            />
          </Section>
        )}

        {etape === 1 && (
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
        )}

        {etape === 2 && (
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
            <SelectField label="Catégorie de revenus" required options={PRECARITES} hint="Détermine la bonification (Coup de pouce CEE, profil MaPrimeRénov')." error={errors.precarite} register={register("precarite")} />
          </Section>
        )}

        {etape === 3 && (
          <Section title="Logement">
            <SelectField label="Type de logement" required options={LOGEMENT_TYPES} error={errors.logement_type} register={register("logement_type")} />
            <TextField label="Année de construction" required type="number" inputMode="numeric" hint={dispositif === "maprimerenov" ? "MaPrimeRénov' : achevé depuis plus de 15 ans." : "CEE : achevé depuis plus de 2 ans."} error={errors.logement_annee_construction} register={register("logement_annee_construction")} />
            <SelectField label="Usage" required options={RESIDENCES} error={errors.logement_residence} register={register("logement_residence")} />
            <TextField label="Surface habitable (m²)" type="number" step="0.01" inputMode="decimal" error={errors.logement_surface_habitable} register={register("logement_surface_habitable")} />
          </Section>
        )}

        {etape === 4 && estPac && (
          <Section
            title="Pompe à chaleur air/eau"
            description="Caractéristiques techniques de la PAC (fiche BAR-TH-171)."
          >
            <SelectField
              label="Régime de température"
              required
              options={{ basse: "Basse température", moyenne_haute: "Moyenne / haute température" }}
              hint="Conditionne l'ETAS minimale (basse ≈ 126 %, moyenne/haute ≈ 111 %)."
              error={errors.pac_temperature}
              register={register("pac_temperature")}
            />
            <TextField label="ETAS (%)" required type="number" step="1" inputMode="numeric" hint="Efficacité énergétique saisonnière du chauffage." error={errors.pac_etas} register={register("pac_etas")} />
            <TextField label="Puissance (kW)" required type="number" step="0.1" inputMode="decimal" error={errors.pac_puissance_kw} register={register("pac_puissance_kw")} />
            <TextField label="Marque" required error={errors.pac_marque} register={register("pac_marque")} />
            <TextField label="Référence / modèle" error={errors.pac_reference} register={register("pac_reference")} />
            <TextField label="Classe du régulateur" placeholder="Ex. IV à VIII" hint="Un régulateur de classe IV à VIII est requis." error={errors.pac_regulateur_classe} register={register("pac_regulateur_classe")} />
          </Section>
        )}

        {etape === 4 && estCet && (
          <Section
            title="Chauffe-eau thermodynamique"
            description="Caractéristiques techniques du CET (fiche BAR-TH-148)."
          >
            <SelectField
              label="Profil de soutirage"
              required
              options={{ M: "Profil M", L: "Profil L", XL: "Profil XL" }}
              hint="Profil de puisage normalisé (EN 16147)."
              error={errors.cet_profil_soutirage}
              register={register("cet_profil_soutirage")}
            />
            <TextField label="COP" required type="number" step="0.01" inputMode="decimal" hint="Coefficient de performance (EN 16147). Minimum indicatif : ≥ 2,5." error={errors.cet_cop} register={register("cet_cop")} />
            <TextField label="Volume du ballon (L)" required type="number" step="1" inputMode="numeric" error={errors.cet_volume_l} register={register("cet_volume_l")} />
            <TextField label="Marque" required error={errors.cet_marque} register={register("cet_marque")} />
            <TextField label="Référence / modèle" error={errors.cet_reference} register={register("cet_reference")} />
          </Section>
        )}

        {etape === 4 && !estPac && !estCet && (
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
        )}

        {etape === 5 && (
          <>
            <Section
              title="Chronologie"
              description="L'ordre des dates conditionne l'éligibilité, cœur du contrôle anti-refus."
            >
              <TextField label="Date de visite technique" type="date" error={errors.date_visite_technique} register={register("date_visite_technique")} />
              <TextField label="Date du devis signé" required type="date" hint="Doit précéder le début des travaux." error={errors.date_devis} register={register("date_devis")} />
              <TextField label="Date de début des travaux" type="date" error={errors.date_debut_travaux} register={register("date_debut_travaux")} />
              <TextField label="Date de fin des travaux" type="date" error={errors.date_fin_travaux} register={register("date_fin_travaux")} />
              <TextField label="Date de la facture" type="date" error={errors.date_facture} register={register("date_facture")} />
            </Section>

            <div className="mt-6">
              <Section title="Montants">
                <TextField label="Montant HT (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ht} register={register("montant_ht")} />
                <TextField label="Montant TTC (€)" required type="number" step="0.01" inputMode="decimal" error={errors.montant_ttc} register={register("montant_ttc")} />
                <TextField label="Prime CEE estimée (€)" type="number" step="0.01" inputMode="decimal" error={errors.montant_prime_estime} register={register("montant_prime_estime")} />
                <TextField label="Aides publiques hors CEE (€), ex. MaPrimeRénov'" type="number" step="0.01" inputMode="decimal" error={errors.montant_aides_publiques} register={register("montant_aides_publiques")} />
              </Section>
            </div>
          </>
        )}
      </div>

      {serverError && (
        <div className="mt-6 rounded border-l-4 border-erreur bg-erreur-bg px-4 py-3 text-sm text-erreur">
          {serverError}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEtape((e) => Math.max(0, e - 1))}
          disabled={etape === 0}
          className="inline-flex h-11 items-center rounded border border-filigrane bg-blanc-casse px-4 text-sm font-medium text-encre transition-colors hover:bg-papier disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Précédent
        </button>

        {dernier ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center rounded bg-terre-cuite px-6 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Création…" : "Créer le dossier"}
          </button>
        ) : (
          <button
            type="button"
            onClick={suivant}
            className="inline-flex h-11 items-center rounded bg-terre-cuite px-6 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover"
          >
            Suivant →
          </button>
        )}
      </div>
    </form>
  );
}
