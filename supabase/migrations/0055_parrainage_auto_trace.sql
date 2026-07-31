-- Auto-parrainage : la trace promise depuis 0012 n'a jamais pu s'écrire.
--
-- LE PROBLÈME. `apply_referral_code` annonce enregistrer l'auto-parrainage en
-- 'self_blocked' (statut prévu par l'enum dès 0012, branche écrite en 0013 et
-- reprise telle quelle en 0048). Mais la ligne qu'elle insère porte
-- referrer_id = referee_id, exactement ce que `referrals_no_self_chk` interdit :
-- l'insert lève une check_violation et la fonction n'a jamais rendu la main.
-- Côté artisan, saisir son propre code ne donne pas « auto-parrainage refusé »
-- mais une erreur Postgres brute, que `src/lib/referral.ts` classe en `unknown`.
-- Le cas jumeau ajouté en 0048 (deux comptes, même SIRET) échappait à la
-- contrainte, les `id` étant distincts : la moitié de la règle marchait, l'autre
-- non, et rien ne le disait. Le test T2 de
-- `supabase/tests/0013_pricing_parrainage_test.sql` le prouvait déjà ; il n'avait
-- jamais été exécuté, faute de base locale.
--
-- LE PIÈGE À NE PAS OUVRIR EN CORRIGEANT. Lever la seule contrainte suffirait à
-- enregistrer la ligne, mais `referrals_referee_unique_idx` réserve UNE ligne par
-- filleul, et la branche auto s'exécute AVANT le contrôle « ce filleul a déjà
-- utilisé un code ». Une tentative bloquée consommerait donc l'unique créneau du
-- filleul, qui ne pourrait plus jamais saisir un vrai code parrain : une faute de
-- frappe deviendrait définitive. C'est déjà le cas aujourd'hui pour la branche
-- SIRET de 0048, seul chemin qui parvient à écrire sa ligne.
--
-- LE CORRECTIF, en trois pièces qui n'ont de sens qu'ensemble :
--   1. la contrainte tolère l'égalité pour le SEUL statut 'self_blocked' ; elle
--      continue d'interdire tout parrainage actif d'un artisan vers lui-même ;
--   2. l'unicité par filleul devient partielle : une ligne bloquée ne consomme
--      plus le créneau ;
--   3. la fonction ignore les lignes 'self_blocked' dans son contrôle « déjà
--      parrainé », et rend la ligne existante au lieu d'en empiler une nouvelle
--      quand la même tentative se répète.
--
-- DROP assumé (AGENTS.md : pas de DROP sans plan). Les deux objets sont
-- remplacés dans la même transaction par une version STRICTEMENT plus permissive.
-- Aucune ligne existante ne peut violer les nouvelles définitions, puisque
-- l'ancienne contrainte rendait l'insert impossible : `referrals` ne contient
-- aujourd'hui aucune ligne d'auto-parrainage direct. Aucune donnée n'est touchée.
--
-- Les trois autres fonctions qui lisent `referrals` (`claim_referee_discount`,
-- `confirm_dossier_payment`) filtrent toutes sur `status = 'pending'` : une ligne
-- 'self_blocked' leur est inerte, aucune n'est à reprendre. L'UI l'affiche déjà
-- (`profil-parrainage.tsx` : « Auto-parrainage refusé »).

-- ---------------------------------------------------------------------------
-- 1. La contrainte : l'égalité n'est admise que pour une tentative bloquée
-- ---------------------------------------------------------------------------
alter table public.referrals
  drop constraint if exists referrals_no_self_chk;

alter table public.referrals
  add constraint referrals_no_self_chk
  check (referrer_id <> referee_id or status = 'self_blocked');

-- ---------------------------------------------------------------------------
-- 2. L'unicité par filleul : une ligne bloquée ne consomme pas le créneau
-- ---------------------------------------------------------------------------
drop index if exists public.referrals_referee_unique_idx;

create unique index if not exists referrals_referee_unique_idx
  on public.referrals (referee_id)
  where status <> 'self_blocked';

-- ---------------------------------------------------------------------------
-- 3. La fonction
-- ---------------------------------------------------------------------------
-- Règle 3 (AGENTS.md) : corps repris de l'état COURANT en base
-- (`pg_get_functiondef`, version 0048), avec deux changements et rien d'autre :
--   - la branche auto rend la ligne bloquée existante avant d'en insérer une ;
--   - le contrôle « déjà parrainé » ignore les lignes 'self_blocked'.
-- `create or replace` conserve les privilèges : aucun revoke/grant à refaire.
create or replace function public.apply_referral_code(p_referee_id uuid, p_code text)
returns public.referrals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer public.artisans;
  v_referee  public.artisans;
  v_ref      public.referrals;
begin
  perform set_config('app.allow_pricing_write', 'on', true);

  -- Contrôle de propriété : l'appelant ne peut poser un code que pour LUI-même
  -- (p_referee_id vient du client). auth.uid() null = service-role → OK.
  if auth.uid() is not null and not exists (
    select 1 from public.artisans a
    where a.id = p_referee_id and a.user_id = auth.uid()
  ) then
    raise exception 'Accès refusé : le filleul doit être le compte appelant'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_referee from public.artisans where id = p_referee_id;
  if not found then
    raise exception 'Filleul % introuvable', p_referee_id using errcode = 'no_data_found';
  end if;

  select * into v_referrer from public.artisans where referral_code = upper(trim(p_code));
  if not found then
    raise exception 'Code parrain % inconnu', p_code using errcode = 'no_data_found';
  end if;

  -- Auto-parrainage : même ligne `artisans`, OU même SIRET renseigné des deux
  -- côtés (second compte du même artisan). Enregistré en self_blocked, sans remise.
  if v_referrer.id = p_referee_id
     or (
          nullif(regexp_replace(coalesce(v_referrer.siret, ''), '\D', '', 'g'), '') is not null
          and regexp_replace(coalesce(v_referrer.siret, ''), '\D', '', 'g')
              = regexp_replace(coalesce(v_referee.siret, ''), '\D', '', 'g')
        )
  then
    -- Tentative déjà consignée : on rend la trace existante plutôt que d'en
    -- empiler une par clic. L'unicité partielle ne les départagerait pas.
    select * into v_ref
      from public.referrals
     where referee_id  = p_referee_id
       and referrer_id = v_referrer.id
       and status      = 'self_blocked'
     limit 1;
    if found then
      return v_ref;
    end if;

    insert into public.referrals (referrer_id, referee_id, code_used, status)
    values (v_referrer.id, p_referee_id, upper(trim(p_code)), 'self_blocked')
    returning * into v_ref;
    return v_ref;
  end if;

  -- Le bonus filleul est réservé au 1er dossier : refus si un dossier est déjà payé.
  if exists (
    select 1 from public.dossiers
    where artisan_id = p_referee_id
      and status in ('paid', 'deposited', 'paid_out')
  ) then
    raise exception 'Le filleul a déjà payé un dossier : code parrain non applicable'
      using errcode = 'check_violation';
  end if;

  -- Un seul parrainage par filleul (index unique partiel sur referee_id). Les
  -- tentatives bloquées ne comptent pas : elles n'ont jamais ouvert de droit.
  if exists (
    select 1 from public.referrals
    where referee_id = p_referee_id
      and status <> 'self_blocked'
  ) then
    raise exception 'Ce filleul a déjà utilisé un code parrain'
      using errcode = 'unique_violation';
  end if;

  insert into public.referrals (referrer_id, referee_id, code_used, status)
  values (v_referrer.id, p_referee_id, upper(trim(p_code)), 'pending')
  returning * into v_ref;

  -- La remise −30 € n'est PAS posée ici : le 1er dossier de l'artisan est offert
  -- (produit d'appel, §10). La remise est réclamée par claim_referee_discount()
  -- au 1er dossier PAYANT du filleul, déclenché au checkout.
  return v_ref;
end $$;
