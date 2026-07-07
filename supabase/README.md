# Supabase — base de données Dossimo

Schéma défini dans [`migrations/`](./migrations). Modèle de données : voir
`CLAUDE.md` §7.

## Appliquer le schéma

### Option A — SQL Editor (le plus simple, sans CLI)

1. Crée un projet sur [supabase.com](https://supabase.com).
2. **Settings → API** : copie `Project URL`, `anon key`, `service_role key`
   dans `.env.local` (voir `.env.example`).
3. **SQL Editor → New query** : colle le contenu de
   [`migrations/0001_initial_schema.sql`](./migrations/0001_initial_schema.sql),
   puis **Run**.

### Option B — Supabase CLI

```bash
npm i -g supabase          # ou: npx supabase ...
supabase link --project-ref <ref>
supabase db push
```

## Régénérer les types TypeScript

Après toute modification du schéma :

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

(En attendant, `src/lib/database.types.ts` est maintenu à la main et reflète
`0001_initial_schema.sql`.)

## Sécurité (RLS)

La Row Level Security est activée sur toutes les tables. Le client navigateur /
authentifié ne voit que ses propres données. Les flux serveur de confiance
(webhooks Stripe, capture de leads, génération documentaire) passent par la clé
**service-role** (`src/lib/supabase/admin.ts`) qui contourne la RLS.
