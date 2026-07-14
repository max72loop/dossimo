"use client";

import { BTN_PRINCIPAL } from "@/components/ui/boutons";
import { Spinner } from "@/components/ui/spinner";
import { Champ, Message } from "@/components/artisan/profil-ui";
import { useAction } from "@/components/artisan/use-action";
import { updateAdresseFacturation } from "@/lib/artisan/facturation-actions";
import { updateContact, updateEntreprise } from "@/lib/artisan/profil-actions";
import type { Artisan } from "@/lib/database.types";

function Enregistrer({ busy }: { busy: boolean }) {
  return (
    <button type="submit" disabled={busy} className={BTN_PRINCIPAL}>
      {busy && <Spinner className="mr-2 h-4 w-4" />}
      Enregistrer
    </button>
  );
}

/**
 * Identité de l'entreprise. Ces trois champs partent tels quels sur le devis, la
 * facture et le Cerfa : une raison sociale approximative ou un numéro RGE absent
 * se paie en refus, pas en simple coquille d'affichage.
 */
export function FormeEntreprise({ artisan }: { artisan: Artisan }) {
  const { busy, resultat, executer, erreurs } = useAction();

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await executer(() =>
      updateEntreprise({
        entreprise: fd.get("entreprise"),
        siret: fd.get("siret"),
        qualification_rge: fd.get("qualification_rge"),
      }),
    );
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <Champ
        label="Raison sociale"
        name="entreprise"
        defaultValue={artisan.entreprise}
        required
        maxLength={160}
        autoComplete="organization"
        erreurs={erreurs?.entreprise}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="SIRET"
          name="siret"
          defaultValue={artisan.siret ?? ""}
          inputMode="numeric"
          placeholder="732 829 320 00074"
          aide="14 chiffres. Vérifié à l'enregistrement."
          erreurs={erreurs?.siret}
        />
        <Champ
          label="Qualification RGE"
          name="qualification_rge"
          defaultValue={artisan.qualification_rge ?? ""}
          placeholder="QB/12345 ou Qualibat 7131"
          aide="Numéro porté sur vos devis et factures."
          erreurs={erreurs?.qualification_rge}
        />
      </div>
      <Message resultat={resultat} />
      <Enregistrer busy={busy} />
    </form>
  );
}

/** Responsable du dossier : le signataire des pièces générées. */
export function FormeContact({ artisan }: { artisan: Artisan }) {
  const { busy, resultat, executer, erreurs } = useAction();

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await executer(() =>
      updateContact({
        prenom: fd.get("prenom"),
        nom: fd.get("nom"),
        telephone: fd.get("telephone"),
      }),
    );
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ
          label="Prénom"
          name="prenom"
          defaultValue={artisan.prenom}
          required
          maxLength={100}
          autoComplete="given-name"
          erreurs={erreurs?.prenom}
        />
        <Champ
          label="Nom"
          name="nom"
          defaultValue={artisan.nom}
          required
          maxLength={100}
          autoComplete="family-name"
          erreurs={erreurs?.nom}
        />
      </div>
      <Champ
        label="Téléphone"
        name="telephone"
        type="tel"
        defaultValue={artisan.telephone ?? ""}
        placeholder="06 12 34 56 78"
        autoComplete="tel"
        aide="Utilisé sur les pièces du dossier, jamais communiqué à des tiers."
        erreurs={erreurs?.telephone}
      />
      <Message resultat={resultat} />
      <Enregistrer busy={busy} />
    </form>
  );
}

/**
 * Adresse de facturation. Mention obligatoire sur la facture (art. 242 nonies A
 * du CGI) : sans elle, le paiement d'un dossier est bloqué en amont.
 */
export function FormeAdresse({ artisan }: { artisan: Artisan }) {
  const { busy, resultat, executer } = useAction();

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await executer(() =>
      updateAdresseFacturation({
        adresse: String(fd.get("adresse") ?? ""),
        code_postal: String(fd.get("code_postal") ?? ""),
        ville: String(fd.get("ville") ?? ""),
      }).then((r) => (r.ok ? { ok: true as const, message: "Adresse enregistrée." } : r)),
    );
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <Champ
        label="Adresse"
        name="adresse"
        defaultValue={artisan.adresse ?? ""}
        required
        placeholder="12 rue des Artisans"
        autoComplete="street-address"
      />
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Champ
          label="Code postal"
          name="code_postal"
          defaultValue={artisan.code_postal ?? ""}
          required
          inputMode="numeric"
          placeholder="75011"
          autoComplete="postal-code"
        />
        <Champ
          label="Ville"
          name="ville"
          defaultValue={artisan.ville ?? ""}
          required
          placeholder="Paris"
          autoComplete="address-level2"
        />
      </div>
      <Message resultat={resultat} />
      <Enregistrer busy={busy} />
    </form>
  );
}
