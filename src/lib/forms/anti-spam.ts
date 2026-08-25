import "server-only";

import { resolveMx } from "node:dns/promises";
import disposableDomains from "disposable-email-domains";

/**
 * Une adresse est recevable si son domaine n'est pas jetable ET peut
 * effectivement recevoir du courrier (enregistrement MX présent).
 *
 * Une panne DNS transitoire (timeout, SERVFAIL) laisse passer : elle ne dit
 * rien sur le domaine, et bloquer dessus pénaliserait un artisan pour un
 * problème réseau qui n'est pas le sien. L'absence confirmée de MX
 * (ENOTFOUND / ENODATA) refuse, elle : le domaine ne peut pas recevoir de
 * réponse, la demande serait de toute façon sans issue.
 */

const domainesJetables = new Set(disposableDomains as string[]);

export async function emailEstRecevable(email: string): Promise<boolean> {
  const domaine = email.split("@")[1]?.trim().toLowerCase();
  if (!domaine) return false;
  if (domainesJetables.has(domaine)) return false;

  try {
    const enregistrements = await resolveMx(domaine);
    return enregistrements.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    console.error("[forms] résolution MX indisponible pour", domaine, err);
    return true;
  }
}
