"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Mail, Ban, Send } from "lucide-react";

import { marquerEnvoye, marquerStop } from "@/lib/sprint/actions";

type Contact = {
  placeId: string;
  name: string | null;
  denomination: string | null;
  city: string | null;
  codePostal: string | null;
  phone: string | null;
  email: string | null;
  rgeDomaines: string[];
  bucket: string;
  metier: string;
  fiches: string;
  message: string;
  objet: string | null;
  lienWa: string | null;
};

function BoutonCopier({ texte, libelle }: { texte: string; libelle: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(texte);
        setCopie(true);
        setTimeout(() => setCopie(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded border border-filigrane bg-blanc-casse px-3 py-1.5 text-xs font-medium text-tampon transition hover:border-tampon"
    >
      {copie ? <Check className="h-3.5 w-3.5 text-succes" /> : <Copy className="h-3.5 w-3.5" />}
      {copie ? "Copié" : libelle}
    </button>
  );
}

function Carte({ c, canal }: { c: Contact; canal: "whatsapp" | "email" }) {
  return (
    <li className="rounded border border-filigrane bg-blanc-casse p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-encre">{c.name || c.denomination || "Sans nom"}</p>
          <p className="text-xs text-ardoise">
            {[c.city, c.codePostal].filter(Boolean).join(" · ")}
            {canal === "whatsapp" && c.phone ? ` · ${c.phone}` : ""}
            {canal === "email" && c.email ? ` · ${c.email}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-papier px-2.5 py-0.5 text-[0.7rem] font-medium text-tampon" title={`Fiches ${c.fiches}`}>
          {c.metier}
        </span>
      </div>

      {/* Tous les domaines RGE : permet de changer l'accroche à la main si besoin. */}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-encre-claire">
        RGE : {c.rgeDomaines.join(" · ") || "aucun"}
      </p>

      {c.objet && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ardoise">Objet :</span>
          <span className="text-xs text-encre">{c.objet}</span>
          <BoutonCopier texte={c.objet} libelle="Copier l'objet" />
        </div>
      )}

      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-papier/60 p-3 font-sans text-xs leading-relaxed text-encre">
        {c.message}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <BoutonCopier texte={c.message} libelle={canal === "email" ? "Copier le corps" : "Copier le message"} />

        {canal === "whatsapp" &&
          (c.lienWa ? (
            <a
              href={c.lienWa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-tampon/40 bg-blanc-casse px-3 py-1.5 text-xs font-semibold text-tampon transition hover:bg-papier"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ouvrir WhatsApp
            </a>
          ) : (
            <span className="text-xs text-erreur">Numéro inexploitable</span>
          ))}

        {canal === "email" && c.email && (
          <a
            href={`mailto:${c.email}?subject=${encodeURIComponent(c.objet ?? "")}&body=${encodeURIComponent(c.message)}`}
            className="inline-flex items-center gap-1.5 rounded border border-tampon/40 bg-blanc-casse px-3 py-1.5 text-xs font-semibold text-tampon transition hover:bg-papier"
          >
            <Mail className="h-3.5 w-3.5" />
            Ouvrir dans le client mail
          </a>
        )}

        <div className="ml-auto flex items-center gap-2">
          <form action={marquerEnvoye}>
            <input type="hidden" name="place_id" value={c.placeId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded bg-terre-cuite px-3 py-1.5 text-xs font-medium text-blanc-casse transition hover:bg-terre-cuite-hover"
            >
              <Send className="h-3.5 w-3.5" />
              Marquer envoyé
            </button>
          </form>
          <form action={marquerStop}>
            <input type="hidden" name="place_id" value={c.placeId} />
            <button
              type="submit"
              title="Enregistrer un refus (STOP / opt-out), définitif"
              className="inline-flex items-center gap-1.5 rounded border border-filigrane px-3 py-1.5 text-xs font-medium text-ardoise transition hover:border-erreur hover:text-erreur"
            >
              <Ban className="h-3.5 w-3.5" />
              STOP
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function SprintListe({ contacts, canal }: { contacts: Contact[]; canal: "whatsapp" | "email" }) {
  if (contacts.length === 0) {
    return (
      <p className="rounded border border-filigrane bg-papier/40 p-6 text-sm text-ardoise">
        Aucun contact à afficher pour ce canal. Vérifie que le tirage a été lancé
        (script <code>prospect_dossimo_tirage.sql</code>), que le plafond du jour
        n&apos;est pas atteint, et pour l&apos;e-mail que des adresses sont validées.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {contacts.map((c) => (
        <Carte key={c.placeId} c={c} canal={canal} />
      ))}
    </ul>
  );
}
