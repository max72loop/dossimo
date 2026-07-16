<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Touching the database? Read `supabase/README.md` first

Non-negotiable. It documents the schema map, the security model, and — most
importantly — the incident history that explains why several files look the way
they do. Skipping it is how the same four mistakes keep getting made.

The short version, if you read nothing else:

1. **Never apply SQL by hand in the Supabase SQL Editor.** Use
   `npx supabase db push`. Hand-applied migrations are applied but not recorded:
   the history lies. This already destroyed two migration files (`0024`, `0025`).
2. **Never rewrite or renumber an applied migration.** Write the next one.
3. **Before any `create or replace function`, read the function's CURRENT
   state**, not the migration that created it. Two successive "repair" migrations
   silently deleted a working feature this way (`source`, cf. 0034 → 0036 → 0038).
4. **Run `npx supabase db reset` before opening a PR.** It is the only proof the
   history still replays. If it fails, no fresh environment can ever be built.
5. **A fix applies everywhere, not in one place.** This codebase's recurring
   defect is a good idea applied to exactly one table. `grep` for the twins.

# Business rules live in data, not in components

Thresholds, prices and eligibility conditions belong in `regles_metier` or
`pricing_tiers` (CLAUDE.md §10, §11) — never hardcoded in a component, and never
duplicated "for display". Two sources for one regulatory value is a guarantee
they will diverge, and Dossimo then manufactures the very refusal it claims to
prevent (CLAUDE.md §8).

If a value is unknown at render time, **say nothing rather than guess**: `prixPack`
returns `"—"` and `PaywallCta` accepts `prix={null}` precisely so no invented
figure ever reaches the artisan. Do not add a `?? "149 €"`-style fallback.

# Never let personal data reach an LLM

`src/lib/admin/nl-query.ts` masks every column flagged `pii` in its catalogue
before sending anything to OpenRouter (`masquerPii`). The admin still sees real
values on screen — they are rendered straight from Supabase. If you add a
nominative column to that catalogue, add it to `pii` in the same edit.

The same reflex applies anywhere else a payload is built for a model: the
beneficiary's tax notice, ID and bank details are the most sensitive data in the
product. Only the tax notice is ever sent to a VLM, deliberately.

# Errors are never ignored silently

Check `error` on every Supabase call that carries a promise to a human — an
opt-out, a revocation, a payment, a marking. A `STOP` swallowed in silence means
re-contacting someone who refused; a failed revocation means a leaked URL that
still works while the UI says it is closed. Fail loudly instead.
