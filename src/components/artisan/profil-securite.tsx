"use client";

import { useRef, useState } from "react";
import { KeyRound, Mail, MonitorSmartphone } from "lucide-react";

import { BTN_PRINCIPAL, BTN_SECONDAIRE } from "@/components/ui/boutons";
import { Spinner } from "@/components/ui/spinner";
import { Champ, Message } from "@/components/artisan/profil-ui";
import { useAction } from "@/components/artisan/use-action";
import { changeEmail, changePassword, signOutOtherDevices } from "@/lib/artisan/profil-actions";

/** Bloc dépliable : la sécurité se consulte souvent, se modifie rarement. */
function Volet({
  titre,
  resume,
  icone: Icone,
  children,
}: {
  titre: string;
  resume: string;
  icone: typeof KeyRound;
  children: (fermer: () => void) => React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="border-b border-filigrane py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icone className="mt-0.5 h-4 w-4 shrink-0 text-ardoise" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-encre">{titre}</p>
            <p className="mt-0.5 text-sm text-ardoise">{resume}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className={BTN_SECONDAIRE}
        >
          {ouvert ? "Annuler" : "Modifier"}
        </button>
      </div>
      {ouvert && <div className="mt-4 pl-0 sm:pl-7">{children(() => setOuvert(false))}</div>}
    </div>
  );
}

function FormeMotDePasse({ fermer }: { fermer: () => void }) {
  const { busy, resultat, executer, erreurs } = useAction();
  const form = useRef<HTMLFormElement>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await executer(() =>
      changePassword({
        currentPassword: fd.get("currentPassword"),
        password: fd.get("password"),
      }),
    );
    if (r.ok) {
      form.current?.reset();
      setTimeout(fermer, 2500);
    }
  }

  return (
    <form ref={form} onSubmit={soumettre} className="max-w-md space-y-4">
      <Champ
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
        erreurs={erreurs?.currentPassword}
      />
      <Champ
        label="Nouveau mot de passe"
        name="password"
        type="password"
        required
        minLength={12}
        maxLength={128}
        autoComplete="new-password"
        aide="12 caractères minimum, avec majuscule, minuscule et chiffre."
        erreurs={erreurs?.password}
      />
      <Message resultat={resultat} />
      <button type="submit" disabled={busy} className={BTN_PRINCIPAL}>
        {busy && <Spinner className="mr-2 h-4 w-4" />}
        Modifier le mot de passe
      </button>
    </form>
  );
}

function FormeEmail({ emailActuel }: { emailActuel: string }) {
  const { busy, resultat, executer, erreurs } = useAction();
  const form = useRef<HTMLFormElement>(null);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await executer(() =>
      changeEmail({
        email: fd.get("email"),
        currentPassword: fd.get("currentPassword"),
      }),
    );
    if (r.ok) form.current?.reset();
  }

  return (
    <form ref={form} onSubmit={soumettre} className="max-w-md space-y-4">
      <Champ
        label="Nouvelle adresse"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="vous@entreprise.fr"
        aide={`Adresse actuelle : ${emailActuel}`}
        erreurs={erreurs?.email}
      />
      <Champ
        label="Votre mot de passe"
        name="currentPassword"
        type="password"
        required
        autoComplete="current-password"
        aide="Confirme que c'est bien vous."
        erreurs={erreurs?.currentPassword}
      />
      <Message resultat={resultat} />
      <button type="submit" disabled={busy} className={BTN_PRINCIPAL}>
        {busy && <Spinner className="mr-2 h-4 w-4" />}
        Envoyer le lien de confirmation
      </button>
    </form>
  );
}

function AutresAppareils() {
  const { busy, resultat, executer } = useAction();

  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-ardoise">
        Utile si vous vous êtes connecté sur un poste partagé ou un téléphone que vous n'avez plus.
        Votre session ici reste ouverte.
      </p>
      <Message resultat={resultat} />
      <button
        type="button"
        disabled={busy}
        onClick={() => executer(() => signOutOtherDevices())}
        className={BTN_SECONDAIRE}
      >
        {busy && <Spinner className="mr-2 h-4 w-4" />}
        Déconnecter les autres appareils
      </button>
    </div>
  );
}

export function SectionSecurite({ email }: { email: string }) {
  return (
    <div>
      <Volet
        titre="Mot de passe"
        resume="Modifiable à tout moment, avec confirmation du mot de passe actuel."
        icone={KeyRound}
      >
        {(fermer) => <FormeMotDePasse fermer={fermer} />}
      </Volet>

      <Volet titre="Adresse email" resume={email} icone={Mail}>
        {() => <FormeEmail emailActuel={email} />}
      </Volet>

      <Volet
        titre="Sessions actives"
        resume="Fermer les sessions ouvertes sur vos autres appareils."
        icone={MonitorSmartphone}
      >
        {() => <AutresAppareils />}
      </Volet>
    </div>
  );
}
