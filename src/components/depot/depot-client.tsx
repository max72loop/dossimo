"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, Plus, ShieldCheck, Upload, X } from "lucide-react";

import { deposerPiece, retirerPiece, type PieceDeposee } from "@/lib/depot/actions";
import { desinscrireDesRelances } from "@/lib/reminders/actions";
import { compresserImage } from "@/lib/depot/compresser-image";
import { etatDesPieces, motifDeRejet, type EtatPiece } from "@/lib/depot/etat-pieces";
import type { PieceAttendue } from "@/lib/depot/pieces-attendues";
import { BTN_PRINCIPAL, BTN_SECONDAIRE_SM, FOCUS } from "@/components/ui/boutons";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";

/**
 * L'écran du bénéficiaire. Une personne qui n'a jamais entendu parler de Dossimo,
 * qui arrive d'un SMS, sur un téléphone, et qui doit photographier quelques papiers.
 *
 * Tout est fait pour qu'il n'ait rien à comprendre : une pièce = une carte, un état.
 * Pas de jargon, pas de compte à créer, pas de formulaire à valider à la fin. Chaque
 * dépôt part tout seul : s'il ferme l'onglet après trois pièces sur quatre, les trois
 * sont arrivées.
 *
 * UNE PIÈCE PEUT TENIR EN PLUSIEURS FICHIERS. Une carte d'identité est recto-verso,
 * un avis d'imposition fait plusieurs pages. L'écran n'acceptait auparavant qu'un
 * fichier par carte et ne proposait ensuite que de le REMPLACER : le client envoyait
 * le recto, puis se retrouvait sans aucun moyen d'envoyer le verso. C'était le
 * premier motif d'appel à l'artisan.
 */

/** Aperçus locaux des fichiers envoyés dans cette session, par id de pièce. */
type Apercus = Record<string, string>;

/**
 * Écran tactile ou non. Le bouton « Photographier » n'a de sens que là où `capture`
 * est honoré : sur un ordinateur, l'attribut est ignoré et le bouton rouvrirait le
 * même sélecteur de fichiers, en promettant un appareil photo qui n'existe pas.
 *
 * `useSyncExternalStore` plutôt qu'un `useEffect` : le serveur rend `false` (aucun
 * `window`), le client lit la vraie valeur dès le premier rendu, sans cascade de
 * rendus ni divergence d'hydratation.
 */
const REQUETE_TACTILE = "(pointer: coarse)";

function useTactile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REQUETE_TACTILE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REQUETE_TACTILE).matches,
    () => false,
  );
}

function Vignette({ url, nom }: { url: string | undefined; nom: string }) {
  if (!url) {
    // Fichier envoyé lors d'une visite précédente : on n'a plus l'objet local, et on
    // ne va pas ouvrir une URL de téléchargement sur un avis d'imposition juste pour
    // afficher une miniature.
    return (
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-papier-fonce text-encre-claire"
        aria-hidden="true"
      >
        <Check className="h-5 w-5" />
      </span>
    );
  }
  return (
    // `next/image` n'a rien à optimiser ici : la source est une URL d'objet locale
    // (`blob:`), déjà en mémoire, qui ne passe par aucun réseau ni aucun loader.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Aperçu de ${nom}`}
      className="h-14 w-14 shrink-0 rounded-lg border border-encre/10 object-cover"
    />
  );
}

function CartePiece({
  etat,
  token,
  apercus,
  onDepot,
  onRetrait,
  onApercu,
  tactile,
}: {
  etat: EtatPiece;
  token: string;
  apercus: Apercus;
  onDepot: (p: PieceDeposee) => void;
  onRetrait: (id: string) => void;
  onApercu: (id: string, url: string) => void;
  tactile: boolean;
}) {
  const fichierInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"repos" | "preparation" | "envoi">("repos");
  const [erreur, setErreur] = useState<string | null>(null);

  const occupe = phase !== "repos";
  const { attendue, fichiers, statut } = etat;
  const motif = motifDeRejet(etat);

  async function choisir(file: File | undefined) {
    if (!file) return;
    setErreur(null);

    // Compression d'abord : c'est la partie longue sur une photo de 12 Mo, et elle
    // mérite son propre libellé, sinon l'utilisateur voit « Envoi » figé plusieurs
    // secondes avant que le moindre octet ne parte.
    setPhase("preparation");
    const pret = await compresserImage(file);

    setPhase("envoi");
    const fd = new FormData();
    fd.append("file", pret);
    const res = await deposerPiece(token, attendue.type, fd);

    setPhase("repos");
    if (fichierInput.current) fichierInput.current.value = "";
    if (photoInput.current) photoInput.current.value = "";
    if (!res.ok) return setErreur(res.error);

    // L'aperçu vient du fichier local : aucune requête, et surtout aucune URL de
    // lecture ouverte sur des pièces qui contiennent une identité et un RIB.
    if (pret.type.startsWith("image/")) {
      onApercu(res.piece.id, URL.createObjectURL(pret));
    }
    onDepot(res.piece);
  }

  async function retirer(id: string) {
    setErreur(null);
    setPhase("envoi");
    const res = await retirerPiece(token, id);
    setPhase("repos");
    // Un retrait qui échoue doit se voir : sinon la carte se vide à l'écran alors que
    // le document est toujours chez l'artisan.
    if (!res.ok) return setErreur(res.error);
    onRetrait(id);
  }

  const cadre =
    statut === "a_revoir"
      ? "border-erreur/30 bg-erreur-bg/40"
      : fichiers.length > 0
        ? "border-succes/30 bg-succes-bg/40"
        : "border-encre/12 bg-blanc-casse";

  return (
    <motion.li layout className={`rounded-xl border p-5 transition-colors ${cadre}`}>
      <div className="flex items-start gap-4">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            statut === "a_revoir"
              ? "bg-erreur text-blanc-casse"
              : fichiers.length > 0
                ? "bg-succes text-blanc-casse"
                : "border border-encre/20 bg-papier text-encre-claire"
          }`}
          aria-hidden="true"
        >
          {statut === "a_revoir" ? (
            <X className="h-4 w-4" />
          ) : fichiers.length > 0 ? (
            <Check className="h-4 w-4" />
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-encre">
            {attendue.titre}
          </h2>
          <p className="mt-1 text-sm text-ardoise">{attendue.aide}</p>

          {motif ? (
            <p className="mt-2 text-sm text-erreur">
              {`Votre artisan vous redemande ce document : ${motif}`}
            </p>
          ) : null}

          {fichiers.length > 0 ? (
            <ul className="mt-4 grid gap-2">
              {fichiers.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg bg-papier/60 p-2"
                >
                  <Vignette
                    url={apercus[f.id]}
                    nom={f.nomFichier ?? "votre document"}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-encre">
                    {f.nomFichier ?? "Document envoyé"}
                  </span>
                  {f.validationStatus === "approved" ? (
                    <span className="shrink-0 text-xs font-medium text-succes">
                      Validé
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => retirer(f.id)}
                      disabled={occupe}
                      aria-label={`Supprimer ${f.nomFichier ?? "ce document"}`}
                      className={`shrink-0 rounded p-1.5 text-ardoise transition-colors hover:text-erreur disabled:opacity-50 ${FOCUS}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {erreur ? (
            <p role="alert" className="mt-3 text-sm text-erreur">
              {erreur}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              ref={fichierInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => choisir(e.target.files?.[0])}
              disabled={occupe}
            />
            {/* Second input, `capture` en plus : ouvre l'appareil photo directement au
                lieu du sélecteur de fichiers. N'a de sens que sur un écran tactile. */}
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={(e) => choisir(e.target.files?.[0])}
              disabled={occupe}
            />

            {occupe ? (
              <p
                role="status"
                className="inline-flex items-center gap-2 text-sm text-ardoise"
              >
                <Spinner />
                {phase === "preparation" ? "Préparation…" : "Envoi en cours…"}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fichierInput.current?.click()}
                  className={
                    fichiers.length > 0 ? BTN_SECONDAIRE_SM : BTN_PRINCIPAL
                  }
                >
                  {fichiers.length > 0 ? (
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {fichiers.length > 0 ? "Ajouter une page" : "Choisir un fichier"}
                </button>
                {tactile ? (
                  <button
                    type="button"
                    onClick={() => photoInput.current?.click()}
                    className={BTN_SECONDAIRE_SM}
                  >
                    <Camera className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Photographier
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

export function DepotClient({
  token,
  prenom,
  entreprise,
  attendues,
  initiales,
}: {
  token: string;
  prenom: string;
  entreprise: string;
  attendues: PieceAttendue[];
  initiales: PieceDeposee[];
}) {
  const [deposees, setDeposees] = useState<PieceDeposee[]>(initiales);
  const [apercus, setApercus] = useState<Apercus>({});
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);

  const tactile = useTactile();

  // Les aperçus sont des URL d'objets : sans révocation, chaque photo envoyée reste
  // en mémoire jusqu'au rechargement de la page.
  useEffect(() => {
    return () => {
      for (const url of Object.values(apercus)) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etats = etatDesPieces(
    attendues,
    deposees.map((p) => ({
      id: p.id,
      type: p.type,
      nomFichier: p.nomFichier,
      validationStatus: p.validationStatus,
      rejectionReason: p.rejectionReason,
      createdAt: p.createdAt,
    })),
  );

  const total = etats.length;
  const fournies = etats.filter((e) => e.fichiers.length > 0 && e.statut !== "a_revoir");
  const restant = total - fournies.length;
  const complet = restant === 0;

  const titre = complet
    ? `Merci ${prenom}, nous avons tout.`
    : `Bonjour ${prenom}, il ${restant === 1 ? "manque un document" : `manque ${restant} documents`} à votre dossier.`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
      <header>
        <Logo
          href={null}
          variant="encre-mono"
          taille="text-[2.5rem] sm:text-[3rem]"
        />
        <h1 className="mt-8 font-display text-2xl font-bold leading-tight text-encre sm:text-3xl">
          {titre}
        </h1>
        {/* Phrases construites en JS, pas en texte JSX : le transform avale l'espace
            qui suit une interpolation, et « Isolation Durandprépare » est la première
            chose que lit le client. */}
        <p className="mt-3 max-w-prose text-base leading-relaxed text-ardoise">
          {`${entreprise} prépare votre dossier d'aide à la rénovation. Ces pièces ne peuvent venir que de vous. Photographiez-les ou déposez-les ici : c'est tout ce qu'on vous demande.`}
        </p>
        {/* La réassurance était en pied de page, en tout petit, APRÈS les boutons. Or
            « pourquoi veulent-ils mon RIB ? » se pose avant de cliquer, pas après.

            Surface `blanc-casse` et non `papier` : le fond de page EST déjà `papier`
            (globals.css), donc le `bg-papier/70` d'origine ne teintait rien du tout
            et le bloc se lisait comme un paragraphe décalé au hasard. C'est le
            traitement de carte du DESIGN.md §5.

            `papier-fonce` et non `blanc-casse` : les cartes blanches sont réservées
            aux pièces à déposer, juste en dessous. Une note de réassurance ne doit
            pas se lire comme une action de plus, d'où un crème simplement plus
            soutenu que le fond. */}
        <div className="mt-5 flex max-w-prose items-start gap-3 rounded-xl bg-papier-fonce p-4">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-succes"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-ardoise">
            {`Vos documents ne sont transmis qu'à ${entreprise}, pour monter votre dossier d'aide. Ils ne sont ni revendus, ni utilisés pour autre chose. Vous pouvez supprimer un document tant que votre artisan ne l'a pas validé.`}
          </p>
        </div>
      </header>

      {/* Une jauge, parce que savoir combien il reste est la seule question qu'on se
          pose sur ce genre de page. Le compteur textuel, lui, n'est PAS masqué aux
          lecteurs d'écran : c'est l'information, la barre n'en est que le décor. */}
      <div className="mt-8">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-papier-fonce"
          aria-hidden="true"
        >
          <motion.div
            className={complet ? "h-full bg-succes" : "h-full bg-accent"}
            initial={false}
            animate={{ width: `${total ? (fournies.length / total) * 100 : 0}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
        <p role="status" className="mt-2 text-xs font-medium text-ardoise">
          {`${fournies.length} sur ${total} document${total > 1 ? "s" : ""} envoyé${fournies.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <ul className="mt-8 grid gap-4">
        {etats.map((etat) => (
          <CartePiece
            key={etat.attendue.type}
            etat={etat}
            token={token}
            apercus={apercus}
            tactile={tactile}
            onApercu={(id, url) => setApercus((prev) => ({ ...prev, [id]: url }))}
            // On AJOUTE, sans plus retirer les fichiers du même type : l'ancien
            // `filter(x => x.type !== p.type)` effaçait de l'écran un fichier qui
            // restait bien présent en base, et faisait mentir la page.
            onDepot={(p) => setDeposees((prev) => [...prev, p])}
            onRetrait={(id) => {
              setDeposees((prev) => prev.filter((x) => x.id !== id));
              setApercus((prev) => {
                if (!prev[id]) return prev;
                URL.revokeObjectURL(prev[id]);
                const reste = { ...prev };
                delete reste[id];
                return reste;
              });
            }}
          />
        ))}
      </ul>

      <AnimatePresence>
        {complet ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-succes/30 bg-succes-bg p-5"
          >
            <p className="font-display text-base font-semibold text-succes">
              C&apos;est complet. Merci {prenom}.
            </p>
            <p className="mt-1 text-sm text-encre">
              {`${entreprise} a reçu vos documents et poursuit le montage de votre dossier. Vous pouvez fermer cette page.`}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Pas de coordonnées de l'artisan ici : cette page est publique, et son
          téléphone comme son e-mail n'ont pas à être exposés à qui détient l'URL.
          Le client garde le contact qui lui a envoyé le lien (SMS, WhatsApp ou
          e-mail), c'est par là qu'il repasse s'il est bloqué. */}
      <footer className="mt-12 border-t border-encre/10 pt-6">
        <p className="text-xs leading-relaxed text-encre-claire">
          {`Ce lien vous est personnel : ne le partagez pas. Dossimo est un service indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France Rénov'.`}
        </p>
        {unsubscribed ? (
          <p role="status" className="mt-3 text-xs text-succes">
            Les relances automatiques sont désactivées pour ce dossier.
          </p>
        ) : (
          <button
            type="button"
            onClick={async () => {
              setUnsubscribeError(null);
              const result = await desinscrireDesRelances(token);
              if (!result.ok) setUnsubscribeError(result.error);
              else setUnsubscribed(true);
            }}
            className={`mt-3 text-xs text-ardoise underline underline-offset-2 hover:text-encre ${FOCUS}`}
          >
            Ne plus recevoir de relances
          </button>
        )}
        {unsubscribeError ? (
          <p role="alert" className="mt-2 text-xs text-erreur">
            {unsubscribeError}
          </p>
        ) : null}
      </footer>
    </main>
  );
}
