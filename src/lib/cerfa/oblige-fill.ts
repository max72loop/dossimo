import "server-only";

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  StandardFonts,
} from "pdf-lib";

import type { DossierComplet } from "@/lib/dossier/get-dossier";
import { LOGEMENT_TYPES, posteLabel } from "@/lib/dossier/cee-isolation";
import { lignesTechniques } from "@/lib/dossier/geste-technique";
import { dateFr, euro } from "@/lib/pack/format";
import { winAnsiSafe } from "@/lib/cerfa/winansi";
import { openRouterChat } from "@/lib/llm/openrouter";
import type { AcroFieldInfo } from "@/lib/cerfa/acroform-inspect";

export interface Fact {
  label: string;
  value: string;
}

export interface FieldMapping {
  field: string;
  value: string;
  confidence: number;
}

/** Seuil de confiance en dessous duquel on n'écrit pas (on préfère laisser vide). */
const CONFIDENCE_MIN = 0.7;

/**
 * Faits connus du dossier, avec libellés français explicites. C'est la « vérité »
 * issue de la saisie unique que le LLM va apparier aux champs de l'AH de l'obligé.
 */
export function canonicalFacts(data: DossierComplet): Fact[] {
  const c = data.caracteristiques;
  const b = c.beneficiaire;
  const plus2ans = new Date().getFullYear() - c.logement.annee_construction > 2;

  const raw: [string, string | null | undefined][] = [
    ["Bénéficiaire — nom et prénom", `${b.prenom} ${b.nom}`],
    ["Bénéficiaire — nom", b.nom],
    ["Bénéficiaire — prénom", b.prenom],
    ["Adresse des travaux", b.adresse],
    ["Code postal", b.code_postal],
    ["Commune", b.commune],
    ["Téléphone du bénéficiaire", b.telephone],
    ["Courriel du bénéficiaire", b.email],
    ["Type de logement", LOGEMENT_TYPES[c.logement.type]],
    ["Année de construction", String(c.logement.annee_construction)],
    ["Logement achevé depuis plus de 2 ans", plus2ans ? "Oui" : "Non"],
    ["Fiche CEE", c.fiche],
    ["Nature des travaux", posteLabel(c)],
    // Caractéristiques techniques du geste réel. Un dossier ne porte que le bloc
    // de sa famille (`travaux` pour l'isolation, `pac` / `cet` / `bois` sinon) :
    // les lire via le dispatch commun évite d'apparier des champs d'isolation à
    // l'AH d'une PAC — et de lever sur les dossiers sans bloc `travaux`.
    ...lignesTechniques(c).map(
      (l): [string, string] => [l.label, l.value],
    ),
    ["Date de visite préalable", frOrNull(data.dates.visite_technique)],
    ["Date d'acceptation du devis", frOrNull(data.dates.devis)],
    ["Date de début des travaux", frOrNull(data.dates.debut_travaux)],
    ["Date de fin des travaux", frOrNull(data.dates.fin_travaux)],
    ["Date de la facture", frOrNull(data.dates.facture)],
    ["Montant HT (€)", euro(c.montants.ht)],
    ["Montant TTC (€)", euro(c.montants.ttc)],
    ["Entreprise (raison sociale)", data.artisan?.entreprise],
    ["SIRET de l'entreprise", data.artisan?.siret],
    ["N° de qualification RGE", c.rge.numero],
    ["Domaine RGE", c.rge.domaine],
    ["RGE valable jusqu'au", frOrNull(c.rge.date_fin)],
  ];

  return raw
    .filter(([, v]) => v != null && v !== "" && v !== "—")
    .map(([label, v]) => ({ label, value: String(v) }));
}

function frOrNull(s: string | null | undefined): string | null {
  if (!s) return null;
  const f = dateFr(s);
  return f === "—" ? null : f;
}

/**
 * Mappe les champs de l'AH de l'obligé vers les faits du dossier via le LLM.
 * Garde-fou : on n'écrit jamais une valeur inventée — le prompt interdit toute
 * correspondance incertaine, et on ne conserve que les mappings au-dessus du
 * seuil de confiance, vers un champ réellement présent.
 */
export async function mapAhFields(
  fields: AcroFieldInfo[],
  facts: Fact[],
  signal?: AbortSignal,
): Promise<FieldMapping[]> {
  const system =
    "Tu apparies les champs d'un formulaire officiel français (attestation sur l'honneur CEE remise par un obligé) aux données connues d'un dossier. " +
    "Règle absolue : ne JAMAIS inventer de valeur. Si aucune donnée connue ne correspond clairement à un champ, ne le mappe pas. " +
    "Ignore les champs de signature, les dates manuscrites, et tout champ propre à l'obligé sans correspondance. Réponds en JSON strict.";

  const user = `Champs du formulaire à remplir (name = identifiant technique exact ; tooltip = libellé lisible s'il existe ; type ; options éventuelles) :
${JSON.stringify(fields)}

Données connues du dossier (issues d'une saisie vérifiée) :
${facts.map((f) => `- ${f.label} : ${f.value}`).join("\n")}

Consigne : pour chaque champ que tu peux remplir AVEC CERTITUDE à partir des données connues, renvoie un objet. Pour une case à cocher (type "checkbox"), value = "true" ou "false". Pour un "dropdown"/"radio"/"optionlist", value DOIT être exactement l'une des options proposées. Laisse de côté tout le reste.

Réponds au format :
{ "mappings": [ { "field": "<name exact>", "value": "<valeur>", "confidence": <nombre 0 à 1> } ] }`;

  const raw = await openRouterChat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    jsonMode: true,
    temperature: 0,
    maxTokens: 1600,
    signal,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse LLM illisible.");
  }

  const list =
    (parsed as { mappings?: unknown }).mappings ?? [];
  if (!Array.isArray(list)) return [];

  const known = new Set(fields.map((f) => f.name));
  const out: FieldMapping[] = [];
  for (const m of list) {
    const field = (m as { field?: unknown }).field;
    const value = (m as { value?: unknown }).value;
    const confidence = Number((m as { confidence?: unknown }).confidence ?? 0);
    if (
      typeof field === "string" &&
      known.has(field) &&
      typeof value === "string" &&
      confidence >= CONFIDENCE_MIN
    ) {
      out.push({ field, value, confidence });
    }
  }
  return out;
}

const isTrue = (v: string) => /^(true|oui|yes|1|x|on)$/i.test(v.trim());

export interface FillOutcome {
  bytes: Uint8Array;
  applied: string[];
  failed: string[];
}

/**
 * Applique les mappings au PDF de l'obligé, aplatit le formulaire (valeurs
 * figées) et renvoie le PDF pré-rempli. Chaque champ est traité selon son type ;
 * un échec ponctuel n'interrompt pas le reste.
 */
export async function fillUploadedAh(
  bytes: Uint8Array,
  mappings: FieldMapping[],
): Promise<FillOutcome> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();
  const applied: string[] = [];
  const failed: string[] = [];

  for (const m of mappings) {
    try {
      const field = form.getField(m.field);
      if (field instanceof PDFTextField) {
        field.setText(winAnsiSafe(m.value));
      } else if (field instanceof PDFCheckBox) {
        if (isTrue(m.value)) field.check();
        else field.uncheck();
      } else if (
        field instanceof PDFDropdown ||
        field instanceof PDFRadioGroup ||
        field instanceof PDFOptionList
      ) {
        field.select(m.value);
      } else {
        failed.push(m.field);
        continue;
      }
      applied.push(m.field);
    } catch {
      failed.push(m.field);
    }
  }

  try {
    form.updateFieldAppearances(font);
  } catch {
    // certaines polices/appearances de l'obligé peuvent résister : non bloquant
  }
  try {
    form.flatten();
  } catch {
    // si l'aplatissement échoue, on renvoie le PDF rempli mais encore éditable
  }

  return { bytes: await doc.save(), applied, failed };
}
