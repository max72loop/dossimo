# Pricing 3 paliers + Parrainage — guide d'exécution

Système de tarification indexée sur l'aide estimée et de parrainage artisan →
artisan. Toute la logique argent vit en SQL (fonctions atomiques `SECURITY
DEFINER`) ; le TypeScript ne fait qu'appeler les RPC. **Le prix final n'est
jamais calculé ni accepté côté client.**

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/migrations/0012_pricing_parrainage_schema.sql` | Types, tables, seed des paliers, RLS, triggers de garde |
| `supabase/migrations/0013_pricing_parrainage_functions.sql` | Les 5 RPC + helpers (`refresh_credit_balance`) |
| `supabase/tests/0013_pricing_parrainage_test.sql` | Cas de test SQL (rollback auto) |
| `src/lib/pricing.ts` | `getQuote` + wrappers RPC pricing typés |
| `src/lib/referral.ts` | `applyReferralCode` + lecture des crédits/parrainages |
| `src/lib/pricing.test.ts` | Tests unitaires de la math de palier (Vitest) |

## Ordre d'exécution

```bash
# 1. Appliquer les migrations (dans l'ordre)
supabase db push            # ou psql -f 0012_… puis -f 0013_…

# 2. Régénérer les types (recommandé, sinon les types à la main suffisent)
npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

# 3. Tests
npx vitest run src/lib/pricing.test.ts                       # math pure
psql "$DATABASE_URL" -f supabase/tests/0013_pricing_parrainage_test.sql  # intégration
```

> Prérequis : extension `pgcrypto` (activée par 0012 pour les codes parrain).

## Paliers (pilotables en base, jamais en dur)

| Palier | Aide estimée | Prix HT |
|---|---|---|
| Essentiel | < 1 000 € | 49 € |
| Pivot | 1 000 – 5 000 € | 149 € |
| Premium | > 5 000 € | 249 € |

Bornes stockées en **cents inclusifs** dans `pricing_tiers`
(`aid_min_cents` / `aid_max_cents`, `NULL` = ∞). Pour ajuster un seuil ou un
prix : `update pricing_tiers …`, aucun redéploiement.

## Les RPC

Toutes atomiques. Les montants sont en **cents** (integer).

### `price_dossier(p_dossier_id, p_estimated_aid_cents default null) → dossiers`
Choisit le palier depuis `estimated_aid_cents`, pose `base_price_cents`,
recalcule `final_price_cents` (net de la remise filleul et des crédits déjà
appliqués), lève `price_warning` si le prix dépasse **12 %** de l'aide. Ne fige
pas. No-op si le prix est déjà figé.

`p_estimated_aid_cents`, quand fourni, est **recalculé côté serveur depuis le
barème** et écrase la valeur en base : c'est la **seule voie autorisée** à
écrire `estimated_aid_cents` (le trigger de garde bloque l'écriture directe).

```ts
import { createClient } from "@/lib/supabase/server";
import { priceDossier, getQuote } from "@/lib/pricing";

const supabase = await createClient();
const quote = await getQuote(supabase, 120000);            // simulation, sans persister
const dossier = await priceDossier(supabase, dossierId, 120000); // pose l'aide + le palier
```

### `apply_referral_code(p_referee_id, p_code) → referrals`
Valide (pas d'auto-parrainage, filleul sans dossier déjà payé, pas de double
parrainage), crée le `referrals` en `pending`. **N'applique pas la remise** : le
1er dossier de l'artisan est offert (produit d'appel, §10), donc la remise −30 €
se pose sur le 1er dossier **payant** via `claim_referee_discount` (au checkout).

```ts
import { applyReferralCode } from "@/lib/referral";

const res = await applyReferralCode(supabase, refereeId, "AB12CD34");
if (!res.ok) {
  // res.reason ∈ unknown_code | already_paid | already_referred | unknown
} else if (res.referral.status === "self_blocked") {
  // code valide mais auto-parrainage : enregistré, pas de remise
}
```

### `claim_referee_discount(p_dossier_id) → dossiers`
Réclame la remise filleul **−30 €** pour ce dossier s'il est le 1er dossier
**payant** d'un filleul avec un parrainage `pending`. Consommation unique (la
remise est liée à un seul dossier via `referee_first_dossier_id`). À appeler au
checkout, après `price_dossier`. No-op si prix figé ou rien à réclamer.

```ts
import { priceDossier, claimRefereeDiscount } from "@/lib/pricing";
await priceDossier(supabase, dossierId, aidCents);
const d = await claimRefereeDiscount(supabase, dossierId); // pose −30 € si éligible
```

### `apply_credits_to_dossier(p_dossier_id) → dossiers`
Consomme les crédits actifs non expirés du propriétaire en **FIFO par date
d'expiration** sur `final_price_cents`. Ré-exécutable (annule d'abord les
applications précédentes du dossier via le grand-livre `credit_applications`).
Interdit une fois le prix figé.

```ts
import { applyCreditsToDossier } from "@/lib/pricing";
const dossier = await applyCreditsToDossier(supabase, dossierId);
```

### `confirm_dossier_payment(p_dossier_id) → dossiers`  *(service-role only)*
Passe le dossier en `paid`, **fige le prix** (`price_locked_at`), puis déclenche
la récompense parrain si c'est le 1er dossier payé d'un filleul lié à un
`referral` pending : émet **50 €** de crédit (12 mois) → statut `rewarded`, ou
`capped` si le parrain a déjà **3 récompenses sur le trimestre glissant (90 j)**.
Idempotent (unique `source_referral_id` + garde sur `status = pending`).

À appeler depuis le **webhook Stripe** avec le client service-role :

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmDossierPayment } from "@/lib/pricing";

const admin = createAdminClient();
await confirmDossierPayment(admin, dossierId); // dans le handler du webhook
```

### `expire_old_credits() → int`  *(service-role, cron)*
Passe les crédits échus en `expired` et rafraîchit les soldes. Retourne le
nombre de crédits expirés.

```ts
import { expireOldCredits } from "@/lib/pricing";
const n = await expireOldCredits(createAdminClient()); // route /api/cron/…
```

Ordonnancement : `pg_cron` si disponible, sinon une route API cron (Vercel Cron)
quotidienne.

## Flux de bout en bout

```
Simulation ......... getQuote(aid)                 → palier + prix affichés
Création dossier ... price_dossier(id, aid)        → base_price, warning, final
Code parrain ....... apply_referral_code(id, code) → parrainage 'pending' (sans remise)
Checkout (tarif) ... price_dossier(id, aid)        → base_price net
Checkout (remise) .. claim_referee_discount(id)    → −30 € sur le 1er dossier PAYANT
(crédits parrain) .. apply_credits_to_dossier(id)  → FIFO sur le final
Paiement Stripe .... confirm_dossier_payment(id)   → figé + récompense parrain 50 €
Cron quotidien ..... expire_old_credits()          → purge des crédits > 12 mois
```

> **1er dossier gratuit × remise filleul.** Le 1er dossier de tout artisan est
> offert (§10). La remise filleul −30 € s'applique donc au 1er dossier **payant**
> (le dossier offert ne passe jamais par le checkout). La récompense parrain 50 €
> se déclenche au 1er dossier **payé** du filleul — cohérent avec la gratuité.

## Intégration dans l'app (branchée)

- **Checkout** — `src/lib/stripe/actions.ts` : `creerSessionPaiementDossier`
  recalcule l'aide via `estimerPrime` (barème), appelle `price_dossier(id, aid)`
  (pose `estimated_aid_cents` + palier), `claim_referee_discount(id)` (−30 € si
  1er dossier payant d'un parrainage), puis facture `final_price_cents` (net de
  la remise filleul et des crédits appliqués). Si le net est **0 €** (couvert par
  les crédits), pas de Stripe : confirmation service-role + paiement à 0 €
  enregistré pour débloquer le livrable.
- **Formulaire 1er dossier** — champ « code parrain » (facultatif) →
  `apply_referral_code` en best-effort (n'échoue jamais la création). Retour
  `?parrain=ok|ko` affiché sur la page dossier.
- **Bouton crédits** — `src/components/dossier/credits-cta.tsx` →
  `appliquerCreditsAuDossier` (price + claim remise + `apply_credits_to_dossier`),
  puis `router.refresh()` : le net affiché et le montant du checkout suivent.
- **Affichage** — `src/app/dossiers/page.tsx` et `.../[id]/page.tsx` utilisent
  `prixPack(aidCents, tiers)` (grille en base, `getActiveTiers` chargée une fois).
  L'**affiché = le facturé** (même source de vérité que le checkout).
- **Webhook** — `src/app/api/stripe/webhook/route.ts` : après l'enregistrement du
  paiement, `confirm_dossier_payment` fige le prix et déclenche la récompense
  parrain. Idempotent (rejeu Stripe sans double crédit).
- **Cron** — `src/app/api/cron/expire-credits/route.ts` (`GET`, protégé par
  `CRON_SECRET`), planifié à 03:00 UTC dans `vercel.json`.

> Remarque : les crédits parrain ne sont **pas auto-appliqués** au checkout (pour
> éviter de « geler » des crédits sur un paiement abandonné). Appeler
> `apply_credits_to_dossier` explicitement (ex. bouton « utiliser mes crédits »)
> avant le paiement ; le checkout facture alors le net.

## Sécurité & garanties

- **Prix serveur uniquement.** Le trigger `protect_dossier_pricing` annule toute
  écriture des colonnes argent hors des fonctions (qui posent le GUC
  `app.allow_pricing_write`). Un client ne peut pas forger `final_price_cents`.
- **Atomicité.** Tarif + crédits + parrainage se jouent dans une seule fonction
  SQL, jamais en plusieurs allers-retours client.
- **Idempotence.** `confirm_dossier_payment` ne peut émettre le crédit parrain
  deux fois (contrainte unique `referral_credits.source_referral_id` + statut).
- **RLS.** Chaque artisan ne lit que ses dossiers, crédits et profil ; un
  `referrals` est lisible par le parrain **et** le filleul ; `pricing_tiers` en
  lecture pour tout utilisateur connecté. Les écritures argent passent par les
  fonctions `SECURITY DEFINER` ou le service-role.

## Cas de test couverts

`supabase/tests/0013_pricing_parrainage_test.sql` (rollback auto) :

1. Garde-fou **> 12 %** (warning levé / non levé)
2. **Auto-parrainage** bloqué (`self_blocked`)
3. **Prix figé** après paiement + garde-fou trigger sur écriture directe
4. **Crédit expiré** non appliqué puis expiré par le job
5. Remise filleul −30 € sur le 1er dossier **payant** + récompense parrain 50 € + idempotence
6. **Cap trimestriel glissant** : 4e filleul récompensable → `capped`, sans crédit

Math de palier (Vitest) : bornes des 3 paliers, frontière stricte du seuil 12 %,
paliers inactifs, libellés euros.
