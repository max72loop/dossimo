"use client";

/**
 * « Vous a-t-on demandé de corriger quelque chose ? »
 *
 * Une seule question, mais c'est celle qui juge le produit : Dossimo promet un
 * dossier qui passe SANS reprise. « Accepté » ne le dit pas — un dossier accepté
 * après deux allers-retours est un dossier que le contrôle anti-refus a laissé
 * partir incomplet.
 *
 * Composant partagé entre le suivi CEE (`ObligeSuivi`) et le suivi MPR
 * (`IssueDossier`) à dessein : la même question posée à deux endroits finit
 * toujours par diverger, et deux formulations donnent deux chiffres.
 *
 * Trois états, jamais deux : « pas encore répondu » reste distinct de « non ».
 * Un booléen à deux états transformerait tous les retours anciens en « accepté
 * du premier coup » et fabriquerait la preuve que le produit marche.
 */
export function ChampReprise({
  demandee,
  motif,
  onDemandee,
  onMotif,
  inputClass,
}: {
  demandee: boolean | null;
  motif: string;
  onDemandee: (v: boolean | null) => void;
  onMotif: (v: string) => void;
  /** Style de champ de la coquille appelante : les deux suivis n'ont pas le même. */
  inputClass: string;
}) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-encre" htmlFor="reprise-depot">
        L&apos;organisme vous a-t-il demandé une correction ?
      </label>
      <select
        id="reprise-depot"
        className={inputClass}
        value={demandee === null ? "" : demandee ? "oui" : "non"}
        onChange={(e) => onDemandee(e.target.value === "" ? null : e.target.value === "oui")}
      >
        <option value="">Je ne l&apos;ai pas encore renseigné</option>
        <option value="non">Non, accepté tel quel</option>
        <option value="oui">Oui, j&apos;ai dû corriger quelque chose</option>
      </select>
      {demandee === true && (
        <input
          className={inputClass}
          value={motif}
          onChange={(e) => onMotif(e.target.value)}
          placeholder="Qu'a-t-il fallu corriger ? (ex. mention absente du devis)"
          aria-label="Correction demandée"
        />
      )}
      <p className="mt-1.5 text-xs text-ardoise">
        C&apos;est la réponse la plus utile de tout le suivi : chaque correction demandée
        devient un contrôle à durcir avant le dépôt suivant.
      </p>
    </div>
  );
}
