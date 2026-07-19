# Design Dossimo — la source de vérité

**Ce fichier fait autorité sur toutes les décisions de design du produit**, de la
landing à l'espace artisan jusqu'aux PDF. Avant toute décision visuelle (couleur,
police, espacement, forme de composant, ton d'un texte affiché), **on relit ce
fichier d'abord**. Une décision se prend ici, puis se répercute dans les fichiers
d'implémentation ci-dessous. Jamais l'inverse, jamais en douce dans un composant.

L'objectif est la **cohérence de bout en bout** : un artisan doit reconnaître
Dossimo à l'identique sur la vitrine, dans son espace, et sur le PDF qu'il imprime
pour son client.

---

## 1. La règle du miroir (à ne jamais oublier)

Un seul fichier ne peut pas porter *physiquement* tous les tokens : le web impose
le CSS (Tailwind v4 veut le `@theme`), les PDF imposent le TypeScript. Les décisions
sont donc **centralisées ici**, avec **une source machine unique** pour les couleurs
et des miroirs qui en dérivent :

| Décision | Source / implémentation |
|---|---|
| **Couleurs** | Source unique : [`src/design/tokens.ts`](src/design/tokens.ts). Miroir web : [`src/app/globals.css`](src/app/globals.css) (`@theme`), **égalité vérifiée par [`src/design/tokens.test.ts`](src/design/tokens.test.ts)**. Miroir PDF : [`src/lib/pack/pdf-theme.ts`](src/lib/pack/pdf-theme.ts) **importe** `tokens.ts` (aucune recopie). |
| Polices | [`src/app/layout.tsx`](src/app/layout.tsx) (next/font) + `@theme` `--font-*`. PDF : Helvetica seulement. |
| Rayons / ombres | `globals.css` (`--radius-*`, `--shadow-*`) ; PDF : `pdf-theme.ts` (`styles`). |
| Boutons / actions | [`src/components/ui/boutons.ts`](src/components/ui/boutons.ts). |

```
Décision (DESIGN.md)
   └─ src/design/tokens.ts   ← source machine unique des couleurs
        ├─ pdf-theme.ts       (import direct, zéro copie)
        └─ globals.css        (miroir CSS, égalité imposée par tokens.test.ts)
```

**Une couleur se change dans `tokens.ts` ET dans `globals.css`, au même commit** :
le test refuse la dérive. Les polices et les rayons restent des miroirs manuels
(pas encore sous test) : à changer des deux côtés à la main.

> Piège React-PDF : les polices Google (Unbounded, Inter…) ne sont PAS disponibles
> dans les PDF, qui n'ont que Helvetica. La *cohérence de marque* dans les PDF passe
> par la couleur, la mise en page et le cachet, pas par la police.

---

## 2. Palette

Identité : monochrome encre + gris, fond crème, bleu de marque pour liens et
actions. Sobre, net.

| Token (`--color-…`) | Valeur | Rôle |
|---|---|---|
| `encre` | `#16202b` | Texte principal, aplats sombres (bandeaux) |
| `tampon` | `#35507f` | Bleu de marque : liens, accents, cachet |
| `terre-cuite` | `#35507f` | **Dette** : alias historique du bleu (l'accent fut terracotta). À renommer `accent` lors de la refonte. Encore utilisé dans `boutons.ts`. |
| `terre-cuite-hover` | `#2a3f65` | Survol de l'action principale |
| `papier` | `#f3f0e9` | Fond de page (crème) |
| `blanc-casse` | `#fbf9f3` | Fond de carte |
| `papier-fonce` | `#eae6dc` | Fond neutre secondaire, survols |
| `ardoise` | `#5b636d` | Texte secondaire |
| `filigrane` | `#e2ddd1` | Filets, bordures |
| `encre-claire` | `#9aa1a9` | Texte tertiaire, marques inactives |

**Sémantique** (toujours en paire couleur + fond clair) :

| Sens | Texte | Fond |
|---|---|---|
| Succès | `succes #2d6a4f` | `succes-bg #e7f1ea` |
| Erreur / bloquant | `erreur #9b2c2c` | `erreur-bg #f6e9e6` |
| Avertissement | `avertissement #a8730b` | `avertissement-bg #f6eed6` |
| Info | `info #35507f` | `info-bg #e9edf4` |

Règle : la couleur sémantique est **séparée** de l'accent de marque. Le rouge est
réservé aux vrais points bloquants.

---

## 3. Typographie

Quatre familles, câblées dans `layout.tsx` puis exposées en tokens `@theme` :

| Token | Police | Rôle |
|---|---|---|
| `--font-display` | Unbounded | Titres forts, wordmark |
| `--font-serif` | Source Serif 4 | Titres de section, chiffres éditoriaux |
| `--font-sans` | Inter | Corps de texte, UI |
| `--font-mono` | Geist Mono | Données : références, dates, montants (avec `tabular-nums`) |

---

## 4. Formes, espacement, mouvement

- **Rayons** : `--radius-sm 6px`, `--radius 8px`, `--radius-md 12px`. Arrondis doux,
  alignés sur l'icône.
- **Ombres** : `--shadow-sm` (0 1px 2px) et `--shadow-md` (0 6px 16px), très
  discrètes. Le relief vient surtout des bordures, pas des ombres.
- **Mouvement** : sobre. `stepIn` (fondu montant 0.25s) pour l'apparition d'étapes.
  Toute animation respecte `prefers-reduced-motion: reduce`.

---

## 5. Composants et motifs

- **Hiérarchie d'action** ([`boutons.ts`](src/components/ui/boutons.ts)) : **un seul
  bouton plein par écran** (l'action principale contextuelle), tout le reste en
  outline. Anneau de focus `FOCUS` obligatoire sur tout élément navigable.
- **Cartes bordées, jamais d'aplat plein saturé.** La sémantique est portée par la
  **bordure** (filet gauche coloré), pas par un fond de couleur pleine. C'est la
  direction des PDF (`pdf-theme.ts`) comme de l'espace artisan.
- **Badges contournés** : bordure + texte colorés, fond transparent.
- **Cachet (tampon)** : élément signature bleu, sur les livrables de contrôle.

---

## 6. Ton et copie (le texte est du design)

- **Français** pour tout ce que voit l'utilisateur (UI, PDF, e-mails), **anglais**
  pour le code et les identifiants (CLAUDE.md §11).
- **Vouvoiement**, direct, concret. On nomme les choses par ce que l'utilisateur
  reconnaît.
- **Ne jamais inventer un chiffre.** Valeur inconnue au rendu = `"—"`, jamais un
  fallback du type `?? "149 €"` (`AGENTS.md`).
- **Mention obligatoire** partout où c'est pertinent : « Dossimo, service
  indépendant d'aide à la préparation de dossier, non affilié à l'Anah ni à France
  Rénov'. » (CLAUDE.md §2).
- Ponctuation naturelle : éviter les tirets cadratins dans la copie.

---

## 7. Accessibilité (socle non négociable)

- Focus clavier toujours visible (`FOCUS`).
- Contrastes lisibles sur fond crème comme sur fond encre.
- `prefers-reduced-motion` respecté partout.
- `.skip-link` en tête de page.

---

## 8. Décisions ouvertes — refonte en cours

> Cette section se remplit AVANT de coder la refonte. Tant qu'une ligne est vide,
> la décision n'est pas prise : ne pas l'improviser dans un composant.

- [ ] Direction : rafraîchissement de l'identité actuelle, ou nouvelle direction ?
- [ ] Palette cible (et sort de l'alias `terre-cuite`).
- [ ] Couple de polices cible (display + corps).
- [ ] Échelle typographique et échelle d'espacement figées.
- [ ] Traitement des cartes / du relief (bordure vs ombre).
- [ ] Déclinaison PDF de la nouvelle direction (dans les contraintes du §1).

---

## 9. Comment changer une décision (recette)

1. **Décider ici d'abord.** Mettre à jour la section concernée de ce fichier, et
   ajouter une ligne au journal (§11). Tant que ce n'est pas écrit, la décision
   n'est pas prise.
2. **Implémenter à la source.** Couleur → [`src/design/tokens.ts`](src/design/tokens.ts).
   Police → [`src/app/layout.tsx`](src/app/layout.tsx). Rayon / ombre → `globals.css`.
   Bouton → [`boutons.ts`](src/components/ui/boutons.ts).
3. **Reporter dans le miroir CSS.** Recopier la même valeur dans le `@theme` de
   [`globals.css`](src/app/globals.css) (le PDF suit `tokens.ts` tout seul).
4. **Lancer le garde-fou.** `npx vitest run src/design/tokens.test.ts` : le miroir
   doit rester vert.
5. **Vérifier le PDF.** Les `COLORS` PDF suivent `tokens.ts` automatiquement ; en
   cas de doute, régénérer un pack et regarder.
6. **Passer la définition de terminé (§10)** avant de committer.

## 10. Définition de « terminé » (couverture)

Calquée sur la checklist PR de `supabase/README.md`. Un changement de design n'est
fini que lorsqu'il est appliqué **partout** — c'est la parade au défaut « appliqué à
un seul endroit » (`AGENTS.md`).

- [ ] Landing / vitrine
- [ ] Espace artisan (page dossier, formulaires, listes)
- [ ] PDF (pack, feuille de route, attestation, fiche client, récap, checklist)
- [ ] E-mails transactionnels
- [ ] Thème clair ET fond encre
- [ ] États focus clavier + `prefers-reduced-motion`
- [ ] `npx vitest run src/design/tokens.test.ts` vert

## 11. Journal des décisions

Deux lignes par décision, datées, pour ne pas re-débattre le passé.

| Date | Décision | Pourquoi |
|---|---|---|
| 2026-07-08 | Palette encre / gris / crème / **bleu** (`#35507f`), polices Unbounded + Inter + Source Serif. | Alignement sur le kit logo. L'accent passe du terracotta au bleu ; le token `terre-cuite` n'est pas renommé (dette assumée, cf. §2). |
| 2026-07-19 | `DESIGN.md` devient la source de vérité ; `tokens.ts` source machine des couleurs + test de miroir ; règle inscrite dans `AGENTS.md`. | Coordonner landing → vitrine → espace artisan → PDF et empêcher la dérive des tokens par machine, pas par discipline. |
