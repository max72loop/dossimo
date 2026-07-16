"use server";

import { cookies } from "next/headers";

import { familleDeGeste, type CeeIsolationInput, type Famille, type TypeIsolation } from "@/lib/dossier/cee-isolation";
import { getCurrentArtisan } from "@/lib/auth/get-artisan";
import { ACCEPTED_DOCUMENT_MIMES, isAcceptedDocument } from "@/lib/piece/file-validation";
import { extractPiece } from "@/lib/piece/extract";

const TAILLE_MAX = 15 * 1024 * 1024;

export type AnalyseDevisResult =
  | {
      ok: true;
      valeurs: Partial<CeeIsolationInput>;
      champsTrouves: string[];
      message: string;
    }
  | { ok: false; error: string; nonConfigure?: boolean };

function dateIso(value: string | null): string | undefined {
  if (!value) return undefined;
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return value;
  const fr = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (!fr) return undefined;
  return `${fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}`;
}

function nomBeneficiaire(value: string | null) {
  if (!value) return {};
  const parties = value.trim().split(/\s+/);
  if (parties.length === 1) return { client_nom: parties[0] };
  return {
    client_prenom: parties[0],
    client_nom: parties.slice(1).join(" "),
  };
}

function profilSoutirage(value: string | null): "M" | "L" | "XL" | undefined {
  const normalise = value?.trim().toUpperCase();
  return normalise === "M" || normalise === "L" || normalise === "XL" ? normalise : undefined;
}

/**
 * Commune du chantier. Priorité à ce que l'IA a lu ; à défaut, on la déduit de
 * l'adresse quand la ville suit le code postal ("… 93170 Bagnolet") — le cas le
 * plus fréquent sur un devis. Sans indice fiable, on laisse vide (l'artisan la
 * saisit) plutôt que d'inventer une commune depuis le seul code postal.
 */
function communeChantier(d: {
  commune: string | null;
  adresse: string | null;
  code_postal: string | null;
}): string | undefined {
  if (d.commune?.trim()) return d.commune.trim();
  if (d.adresse && d.code_postal) {
    const apresCp = d.adresse.match(new RegExp(`${d.code_postal}\\s+([A-Za-zÀ-ÿ'’\\- ]{2,})`));
    if (apresCp) return apresCp[1].split(/[,;]/)[0].trim() || undefined;
  }
  return undefined;
}

/**
 * Emplacement isolé (texte libre du devis) → type d'isolation du référentiel.
 * On lit d'abord le libellé ("combles perdus", "murs"…), puis on retombe sur la
 * fiche BAR-EN si besoin. L'artisan confirme ensuite.
 */
function typeIsolationDepuis(
  emplacement: string | null,
  fiche: string | null,
): TypeIsolation | undefined {
  const t = emplacement?.toLowerCase() ?? "";
  if (t.includes("comble")) return "combles_perdus";
  if (t.includes("rampant") || t.includes("toiture")) return "rampants_toiture";
  if (t.includes("mur")) return "murs";
  if (t.includes("plancher") || t.includes("sol")) return "plancher_bas";
  if (fiche?.startsWith("BAR-EN-102")) return "murs";
  if (fiche?.startsWith("BAR-EN-103")) return "plancher_bas";
  if (fiche?.startsWith("BAR-EN-101")) return "combles_perdus";
  return undefined;
}

/**
 * Première lecture du devis, avant la saisie. L'IA ne crée aucun verdict : elle
 * recopie uniquement les informations visibles pour préremplir le formulaire.
 * L'artisan les confirme ensuite et le moteur de règles effectue le contrôle.
 */
export async function analyserDevisInitial(formData: FormData): Promise<AnalyseDevisResult> {
  const artisan = await getCurrentArtisan();
  const cookieStore = await cookies();
  if (!artisan && cookieStore.has("dossimo_essai_devis")) {
    return {
      ok: false,
      error: "Votre essai gratuit a déjà été utilisé. Créez votre compte pour continuer avec ce devis.",
    };
  }

  const file = formData.get("file");
  const geste = formData.get("geste");
  const dispositif = formData.get("dispositif");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Ajoutez un devis en PDF ou en photo." };
  }
  if (typeof geste !== "string" || !["auto", "isolation", "pac_air_eau", "cet", "bois"].includes(geste)) {
    return { ok: false, error: "Choisissez d'abord le type de travaux." };
  }
  if (dispositif !== "auto" && dispositif !== "cee" && dispositif !== "maprimerenov") {
    return { ok: false, error: "Choisissez le dispositif visé." };
  }
  if (!ACCEPTED_DOCUMENT_MIMES.has(file.type) || file.size > TAILLE_MAX) {
    return { ok: false, error: "Format non supporté ou fichier supérieur à 15 Mo." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isAcceptedDocument(bytes, file.type)) {
    return { ok: false, error: "Le fichier ne semble pas être un PDF ou une image valide." };
  }

  const extraction = await extractPiece({
    bytes,
    mime: file.type,
    filename: file.name,
    type: "devis",
    famille: geste === "auto" ? "auto" : familleDeGeste(geste),
  });
  if (!extraction.ok) {
    return {
      ok: false,
      nonConfigure: extraction.reason === "non-configure",
      error:
        extraction.reason === "non-configure"
          ? "La lecture assistée n'est pas activée. Vous pouvez continuer avec la saisie guidée."
          : extraction.message ?? "Dossimo n'a pas réussi à lire ce devis.",
    };
  }

  const d = extraction.data;
  const gesteDetecte: Famille =
    geste !== "auto"
      ? (geste as Famille)
      : d.famille ??
        (d.fiche?.startsWith("BAR-TH-171")
          ? "pac_air_eau"
          : d.fiche?.startsWith("BAR-TH-148")
            ? "cet"
            : d.fiche?.startsWith("BAR-TH-112")
              ? "bois"
              : "isolation");
  const dispositifDetecte = dispositif === "auto" ? d.dispositif ?? "cee" : dispositif;
  const valeurs: Partial<CeeIsolationInput> = {
    dispositif: dispositifDetecte,
    geste: gesteDetecte,
    ...nomBeneficiaire(d.beneficiaire_nom),
    client_adresse: d.adresse ?? undefined,
    client_code_postal: d.code_postal ?? undefined,
    client_commune: communeChantier(d),
    montant_ht: d.montant_ht ?? undefined,
    montant_ttc: d.montant_ttc ?? undefined,
    date_devis: dateIso(d.date),
    rge_numero: d.rge_numero ?? undefined,
    rge_domaine: d.rge_domaine ?? undefined,
    rge_date_fin: dateIso(d.rge_validite),
    type_isolation:
      gesteDetecte === "isolation"
        ? typeIsolationDepuis(d.isolation_emplacement, d.fiche)
        : undefined,
    surface_isolee_m2: d.surface_isolee_m2 ?? undefined,
    resistance_thermique_r: d.resistance_thermique_r ?? undefined,
    epaisseur_mm: d.isolant_epaisseur_mm ?? undefined,
    isolant_marque: d.isolant_marque ?? undefined,
    isolant_reference: d.isolant_reference ?? undefined,
    pac_etas: d.pac_etas ?? undefined,
    pac_puissance_kw: d.pac_puissance_kw ?? undefined,
    pac_marque: d.pac_marque ?? undefined,
    pac_reference: d.pac_reference ?? undefined,
    pac_regulateur_classe: d.pac_regulateur_classe ?? undefined,
    cet_cop: d.cet_cop ?? undefined,
    cet_volume_l: d.cet_volume_l ?? undefined,
    cet_profil_soutirage: profilSoutirage(d.cet_profil_soutirage),
    cet_marque: d.cet_marque ?? undefined,
    cet_reference: d.cet_reference ?? undefined,
    bois_rendement: d.bois_rendement ?? undefined,
    bois_emissions_co: d.bois_emissions_co ?? undefined,
    bois_marque: d.bois_marque ?? undefined,
    bois_reference: d.bois_reference ?? undefined,
  };

  const champsTrouves = Object.entries(valeurs)
    .filter(([cle, valeur]) => !["dispositif", "geste"].includes(cle) && valeur !== undefined && valeur !== "")
    .map(([cle]) => cle);

  if (!artisan) {
    cookieStore.set("dossimo_essai_devis", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }

  return {
    ok: true,
    valeurs,
    champsTrouves,
    message: `${champsTrouves.length} information${champsTrouves.length > 1 ? "s" : ""} préremplie${champsTrouves.length > 1 ? "s" : ""} depuis le devis.`,
  };
}
