"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProfilResult } from "@/lib/artisan/profil-actions";

/**
 * Cycle de vie commun aux formulaires du compte : état d'envoi, résultat,
 * erreurs par champ, et rafraîchissement des données serveur après succès.
 */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resultat, setResultat] = useState<ProfilResult | null>(null);

  const executer = useCallback(
    async (
      tache: () => Promise<ProfilResult>,
      options?: { onSucces?: () => void },
    ): Promise<ProfilResult> => {
      setBusy(true);
      setResultat(null);
      try {
        const r = await tache();
        setResultat(r);
        if (r.ok) {
          options?.onSucces?.();
          router.refresh();
        }
        return r;
      } catch {
        const r: ProfilResult = { ok: false, error: "Une erreur est survenue. Réessayez." };
        setResultat(r);
        return r;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  return {
    busy,
    resultat,
    executer,
    erreurs: resultat && !resultat.ok ? resultat.fieldErrors : undefined,
  };
}
