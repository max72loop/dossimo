-- Répare l'inscription, cassée par le `search_path` du trigger de création de fiche.
--
-- Symptôme : tout `auth.signUp` échouait en 500 « Database error saving new user ».
-- Plus aucun artisan ne pouvait créer de compte.
--
-- Chaîne exacte :
--   1. insert sur auth.users
--   2. `handle_new_artisan_user` (security definer, search_path = public, pg_temp)
--   3. insert sur public.artisans
--   4. trigger `artisans_set_referral_code` -> `set_referral_code()`
--   5. -> `gen_referral_code()` -> `gen_random_bytes()`  <-- pgcrypto, schéma `extensions`
--   6. `extensions` absent du search_path hérité : fonction introuvable, transaction annulée.
--
-- Ni `set_referral_code` ni `gen_referral_code` ne fixent leur propre search_path :
-- elles héritent de celui de l'appelant. Tant qu'elles étaient appelées depuis une
-- session normale (dont le search_path inclut `extensions`), tout passait ; appelées
-- depuis une fonction security definer au search_path verrouillé, elles cassent.
--
-- Le bug dormait dans 0030 depuis son écriture. 0030 n'ayant jamais été réellement
-- exécutée (elle était enregistrée sans l'être, cf. 0036), il n'avait jamais mordu :
-- sans trigger, l'inscription passait — au prix d'une fiche artisan jamais créée.
-- 0036 a rétabli le trigger et donc réveillé le bug.
--
-- Correctif en deux temps, volontairement :
--   a) `gen_referral_code` devient autonome (search_path explicite incluant
--      `extensions`). C'est la vraie correction : une fonction qui dépend d'une
--      extension ne doit pas dépendre du search_path de qui l'appelle.
--   b) `handle_new_artisan_user` inclut `extensions` par ceinture et bretelles,
--      pour que la chaîne tienne même si une autre fonction appelée plus tard
--      oublie sa propre déclaration.

-- a) La fonction qui utilise pgcrypto se suffit à elle-même.
create or replace function public.gen_referral_code(len int default 8)
returns text
language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  b bytea := gen_random_bytes(len);
  i int;
begin
  for i in 0..len-1 loop
    code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return code;
end $$;

-- b) Le trigger d'inscription voit `extensions`, quoi qu'appellent ses appelées.
create or replace function public.handle_new_artisan_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.artisans (user_id, entreprise, nom, prenom, email, telephone)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'entreprise'), ''), 'Entreprise à compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nom'), ''), 'À compléter'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'prenom'), ''), 'À compléter'),
    coalesce(new.email, new.id::text || '@compte.local'),
    nullif(trim(new.raw_user_meta_data ->> 'telephone'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
