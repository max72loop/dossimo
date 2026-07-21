-- Borne le grant UPDATE sur `dossiers` aux seules colonnes que l'espace artisan
-- écrit, sur le modèle exact de 0031 pour `artisans` (le jumeau resté à faire,
-- cf. supabase/README.md §4 et §8).
--
-- LE PROBLÈME. La policy "artisan gere ses dossiers" (0001) borne la LIGNE
-- (le dossier appartient à l'artisan connecté), pas la COLONNE. Avec le grant
-- UPDATE que Supabase accorde par défaut à `authenticated`, un artisan peut
-- réécrire via PostgREST n'importe quelle colonne de SES dossiers : se marquer
-- `delivered_at`, changer sa `formule`, forcer le statut de facturation
-- (`status`, `final_price_cents`, `credit_applied_cents`…) ou réattribuer le
-- dossier à un autre `artisan_id`. Le déblocage du pack reste protégé (il dépend
-- de `paiements`, en lecture seule côté artisan) mais l'intégrité du parcours et
-- de la facturation, non.
--
-- LES COLONNES AUTORISÉES sont exactement celles qu'un chemin authenticated
-- (client RLS `createClient`, pas service-role) écrit aujourd'hui :
--   statut                            → parcours-actions.ts
--   oblige_id                         → oblige-actions.ts
--   montant_estime                    → dossier/actions.ts (updateMontantPrime)
--   caracteristiques_techniques_json  → dossier/actions.ts (updateMontantPrime)
--   vigilance_json, vigilance_at      → llm/actions.ts
--   pieces_vues_at                    → depot/actions.ts (marquage « vu » artisan)
-- Tout le reste (billing, formule, delivered_at, source, artisan_id, dates,
-- dispositif…) n'est posé qu'à l'insertion ou par le service-role (webhook
-- Stripe, génération), que `revoke ... from authenticated` ne touche pas.
--
-- On révoque de `anon, authenticated` uniquement (pas de `public`) : `service_role`
-- garde donc son grant, inutile de le lui re-accorder (README §4).

revoke update on public.dossiers from anon, authenticated;

grant update (
  statut,
  oblige_id,
  montant_estime,
  caracteristiques_techniques_json,
  vigilance_json,
  vigilance_at,
  pieces_vues_at
) on public.dossiers to authenticated;

-- PostgREST met le schéma en cache : le recharger pour que le nouveau grant
-- prenne effet sans attendre (README §4).
notify pgrst, 'reload schema';
