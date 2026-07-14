-- Profil artisan : édition en libre-service depuis l'espace, colonnes
-- sensibles verrouillées, email de la fiche synchronisé avec Auth.

-- ---------------------------------------------------------------------------
-- 1) Colonnes modifiables par l'artisan
-- La policy "artisan modifie sa fiche" borne la LIGNE (user_id = auth.uid()),
-- elle ne borne pas les COLONNES. Avec le grant UPDATE par défaut, un client
-- authenticated peut réécrire via PostgREST son solde de crédits, son code
-- parrain, son statut d'abonnement ou l'email de sa fiche. On restreint le
-- grant aux seules colonnes que le formulaire de profil expose.
-- ---------------------------------------------------------------------------
revoke update on public.artisans from anon, authenticated;

grant update (
  entreprise,
  nom,
  prenom,
  telephone,
  adresse,
  code_postal,
  ville,
  siret,
  qualification_rge
) on public.artisans to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Email de la fiche = email d'authentification
-- Le changement d'adresse passe par Supabase Auth (double confirmation). La
-- fiche métier ne doit se resynchroniser qu'une fois la nouvelle adresse
-- confirmée, donc ici, sur l'écriture réelle de auth.users.email, et non au
-- moment de la demande.
-- ---------------------------------------------------------------------------
create or replace function public.sync_artisan_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.artisans
       set email = new.email
     where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_artisan_email();
