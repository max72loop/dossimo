-- Répare trois régressions de fonctions, révélées par l'audit du 2026-07-16.
--
-- Les trois viennent du même motif : une bonne pratique appliquée à un endroit
-- et pas aux autres, ou une migration « réparatrice » qui rejoue une version
-- ANTÉRIEURE d'une fonction et écrase silencieusement une migration passée.
--
-- Règle à retenir pour la suite : `create or replace function` ÉCRASE tout. Avant
-- d'en écrire un, relire l'état courant de la fonction (pas la migration qui l'a
-- créée : la DERNIÈRE qui l'a touchée). Sinon on perd du travail sans erreur.

-- ---------------------------------------------------------------------------
-- 1) `handle_new_artisan_user` : restaurer la colonne `source`, perdue deux fois.
--
-- Chaîne de la régression :
--   0034 ajoute `source` à l'insert (attribution d'acquisition, A/B test
--        WhatsApp vs e-mail du plan v3).
--   0036 « rejoue 0030 à l'identique » pour réparer le rate-limit -> insert SANS
--        `source`. La 0034 est écrasée.
--   0038 repart de la version 0036 pour réparer le search_path -> toujours sans
--        `source`.
--
-- Résultat : `src/lib/auth/actions.ts` posait bien `source` dans
-- `raw_user_meta_data`, `artisans.source` existait (0034), mais plus personne ne
-- faisait le lien. L'attribution était morte, sans la moindre erreur visible.
--
-- Cette version = celle de 0038 (search_path correct, incluant `extensions` pour
-- pgcrypto) + l'insert de `source` de 0034. Les deux corrections tiennent enfin
-- ensemble.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_artisan_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.artisans (user_id, entreprise, nom, prenom, email, telephone, source)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'entreprise'), ''), 'Entreprise à compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nom'), ''), 'À compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'prenom'), ''), 'À compléter'),
    coalesce(new.email, new.id::text || '@compte.local'),
    nullif(trim(new.raw_user_meta_data ->> 'telephone'), ''),
    -- `nullif(trim(...), '')` : une source absente reste NULL, jamais chaîne vide.
    nullif(trim(new.raw_user_meta_data ->> 'source'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) `search_path` manquants.
--
-- `alter function ... set search_path` plutôt que `create or replace` : on ne
-- retouche que l'attribut, sans recopier le corps. Recopier un corps, c'est
-- exactement ce qui a produit la régression du point 1.
--
-- `set_referral_code` est le maillon intermédiaire de la chaîne d'inscription
-- (trigger artisans -> set_referral_code -> gen_referral_code -> pgcrypto). La
-- 0038 a rendu `gen_referral_code` autonome et NOMMÉ le principe (« une fonction
-- qui dépend d'une extension ne doit pas dépendre du search_path de qui
-- l'appelle »), mais ne l'a appliqué qu'à moitié : `set_referral_code` n'a
-- toujours pas le sien. Elle ne survit aujourd'hui que parce qu'elle qualifie
-- ses objets. C'est de la chance, pas une garantie.
-- ---------------------------------------------------------------------------
alter function public.set_referral_code()
  set search_path = public, extensions, pg_temp;

-- SECURITY INVOKER, donc risque faible, mais un search_path explicite sur toute
-- fonction appelée depuis un trigger coûte une ligne et supprime la question.
alter function public.protect_dossier_pricing()
  set search_path = public, pg_temp;

alter function public.factures_immuables()
  set search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 3) `emettre_facture` : deux défauts sur la fonction la plus sensible du schéma.
--
-- a) `pg_temp` absent du search_path (0014:117 : `set search_path = public`).
--    En PostgreSQL, si `pg_temp` n'est PAS mentionné explicitement, il est
--    implicitement cherché EN PREMIER pour les noms de relations. Un appelant
--    capable d'ouvrir une session SQL pourrait créer `pg_temp.paiements` ou
--    `pg_temp.artisans` et détourner les lectures de la fonction, qui s'exécute
--    avec les droits du propriétaire. Le mettre en DERNIER ferme la porte.
--    C'était la seule SECURITY DEFINER du schéma dans ce cas : les 12 autres
--    déclarent bien `pg_temp` en fin de liste.
--
-- b) `revoke all ... from public` (0014:237) sans `grant execute to service_role`
--    derrière. Les fonctions sont créées avec `execute` accordé à PUBLIC par
--    défaut ; le `revoke` le retire À TOUT LE MONDE, y compris `service_role`,
--    qui n'est pas superutilisateur. La 0030/0036 fait bien le couple
--    revoke + grant ; la 0014 n'a fait que le revoke. Le webhook Stripe risquait
--    `permission denied for function emettre_facture`.
-- ---------------------------------------------------------------------------
alter function public.emettre_facture(uuid, numeric, text)
  set search_path = public, pg_temp;

grant execute on function public.emettre_facture(uuid, numeric, text) to service_role;

-- PostgREST met le schéma en cache : sans ce signal, les changements de droits
-- ne sont visibles qu'au prochain redémarrage.
notify pgrst, 'reload schema';
