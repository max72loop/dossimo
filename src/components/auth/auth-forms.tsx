"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { requestPasswordReset, signIn, signUp, updatePassword, type AuthResult } from "@/lib/auth/actions";
import { destinationApresAuth } from "@/lib/auth/redirect";

const inputClass =
  "mt-1.5 h-11 w-full rounded border border-filigrane bg-blanc-casse px-3.5 text-sm text-encre placeholder:text-encre-claire outline-none transition focus:border-tampon focus:ring-2 focus:ring-tampon/15";
const labelClass = "block text-sm font-medium text-ardoise";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.[0]) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-erreur">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
      {messages[0]}
    </p>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-terre-cuite px-5 text-sm font-medium text-blanc-casse transition-colors hover:bg-terre-cuite-hover disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- Connexion */
export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await signIn({
        email: fd.get("email"),
        password: fd.get("password"),
      });
      if (r.ok) {
        router.push(destinationApresAuth(next));
        router.refresh();
        return;
      }
      setResult(r);
    } catch {
      setResult({ ok: false, error: "Une erreur est survenue. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  const fe = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>Email professionnel</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@entreprise.fr" className={inputClass} />
        <FieldError messages={fe?.email} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
        <FieldError messages={fe?.password} />
        <p className="mt-2 text-right text-xs">
          <Link href="/mot-de-passe-oublie" className="text-tampon underline-offset-4 hover:underline">Mot de passe oublié ?</Link>
        </p>
      </div>

      {result && !result.ok && !fe && (
        <p className="flex items-center gap-2 text-[0.813rem] text-erreur">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {result.error}
        </p>
      )}

      <SubmitButton loading={loading}>Se connecter</SubmitButton>

      <p className="text-center text-sm text-ardoise">
        Pas encore de compte ?{" "}
        <Link href={next ? `/inscription?next=${encodeURIComponent(destinationApresAuth(next))}` : "/inscription"} className="text-tampon underline-offset-4 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

/* -------------------------------------------------------------- Inscription */
export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await signUp({
        email: fd.get("email"),
        password: fd.get("password"),
        entreprise: fd.get("entreprise"),
        nom: fd.get("nom"),
        prenom: fd.get("prenom"),
        telephone: fd.get("telephone"),
        // Reporté dans le lien de confirmation : sans lui, un compte à
        // confirmation email retomberait sur /dossiers et perdrait la reprise.
        next,
      });
      if (r.ok) {
        if (r.confirmationRequired) {
          setResult(r);
          return;
        }
        router.push(destinationApresAuth(next));
        router.refresh();
        return;
      }
      setResult(r);
    } catch {
      setResult({ ok: false, error: "Une erreur est survenue. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  const fe = result && !result.ok ? result.fieldErrors : undefined;

  if (result?.ok && result.confirmationRequired) {
    return (
      <div className="rounded border border-succes/30 bg-succes-bg p-4 text-sm leading-6 text-succes">
        <p className="font-semibold">Confirmez votre adresse email</p>
        <p className="mt-1">{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="prenom" className={labelClass}>Prénom</label>
          <input id="prenom" name="prenom" type="text" required autoComplete="given-name" className={inputClass} />
          <FieldError messages={fe?.prenom} />
        </div>
        <div>
          <label htmlFor="nom" className={labelClass}>Nom</label>
          <input id="nom" name="nom" type="text" required autoComplete="family-name" className={inputClass} />
          <FieldError messages={fe?.nom} />
        </div>
      </div>
      <div>
        <label htmlFor="entreprise" className={labelClass}>Raison sociale</label>
        <input id="entreprise" name="entreprise" type="text" required autoComplete="organization" placeholder="Nom de l'entreprise" className={inputClass} />
        <FieldError messages={fe?.entreprise} />
      </div>
      <div>
        <label htmlFor="telephone" className={labelClass}>Téléphone <span className="text-encre-claire">(optionnel)</span></label>
        <input id="telephone" name="telephone" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" className={inputClass} />
        <FieldError messages={fe?.telephone} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Email professionnel</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@entreprise.fr" className={inputClass} />
        <FieldError messages={fe?.email} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Mot de passe</label>
        <input id="password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="12 caractères, majuscule et chiffre" className={inputClass} />
        <FieldError messages={fe?.password} />
      </div>

      {result && !result.ok && !fe && (
        <p className="flex items-center gap-2 text-[0.813rem] text-erreur">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {result.error}
        </p>
      )}

      <SubmitButton loading={loading}>Créer mon compte</SubmitButton>

      <p className="text-center text-sm text-ardoise">
        Déjà un compte ?{" "}
        <Link href={next ? `/connexion?next=${encodeURIComponent(destinationApresAuth(next))}` : "/connexion"} className="text-tampon underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function PasswordResetRequestForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setResult(null);
    const fd = new FormData(e.currentTarget);
    try { setResult(await requestPasswordReset({ email: fd.get("email") })); }
    catch { setResult({ ok: false, error: "Une erreur est survenue. Réessayez." }); }
    finally { setLoading(false); }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label htmlFor="reset-email" className={labelClass}>Email professionnel</label><input id="reset-email" name="email" type="email" required autoComplete="email" className={inputClass} /></div>
      {result && <p className={`text-sm ${result.ok ? "text-succes" : "text-erreur"}`}>{result.ok ? result.message : result.error}</p>}
      <SubmitButton loading={loading}>Envoyer le lien</SubmitButton>
      <p className="text-center text-sm"><Link href="/connexion" className="text-tampon hover:underline">Retour à la connexion</Link></p>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setResult(null);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await updatePassword({ password: fd.get("password") }); setResult(r);
      if (r.ok) setTimeout(() => { router.push("/dossiers"); router.refresh(); }, 800);
    } catch { setResult({ ok: false, error: "Une erreur est survenue. Réessayez." }); }
    finally { setLoading(false); }
  }
  const fe = result && !result.ok ? result.fieldErrors : undefined;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div><label htmlFor="new-password" className={labelClass}>Nouveau mot de passe</label><input id="new-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" placeholder="12 caractères, majuscule et chiffre" className={inputClass} /><FieldError messages={fe?.password} /></div>
      {result && <p className={`text-sm ${result.ok ? "text-succes" : "text-erreur"}`}>{result.ok ? result.message : result.error}</p>}
      <SubmitButton loading={loading}>Modifier mon mot de passe</SubmitButton>
    </form>
  );
}
