-- =============================================================================
-- Dossimo — Pricing 3 paliers + Parrainage (FONCTIONS / RPC)
-- =============================================================================
-- Partie 2/2. Toute la logique argent est ici, en SQL, pour l'ATOMICITÉ :
-- tarif + application crédits + déclenchement parrainage ne doivent jamais se
-- jouer en plusieurs allers-retours côté client.
--
-- Toutes les fonctions qui touchent à l'argent sont SECURITY DEFINER (pour
-- écrire les crédits du PARRAIN, pas seulement de l'appelant) et posent le GUC
-- app.allow_pricing_write='on' pour franchir le trigger protect_dossier_pricing.
-- search_path verrouillé pour éviter tout détournement.
--
-- Constantes métier (faciles à externaliser plus tard si besoin) :
--   • Remise filleul 1er dossier ......... 3000 cents (30 €)
--   • Crédit parrain par filleul récompensé 5000 cents (50 €)
--   • Validité d'un crédit ................ 12 mois
--   • Cap récompenses parrain ............. 3 par trimestre GLISSANT (90 jours)
--   • Garde-fou prix ...................... prix ≤ 12 % de l'aide estimée
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper : recalcule le solde matérialisé d'un artisan (crédits vivants).
-- ---------------------------------------------------------------------------
create or replace function public.refresh_credit_balance(p_artisan_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.artisans a
     set credit_balance_cents = coalesce((
       select sum(c.amount_cents - c.consumed_cents)
       from public.referral_credits c
       where c.artisan_id = p_artisan_id
         and c.status = 'active'
         and c.expires_at > now()
     ), 0)
   where a.id = p_artisan_id;
$$;

-- ---------------------------------------------------------------------------
-- price_dossier(dossier_id)
--   Choisit le palier depuis estimated_aid_cents, pose base_price_cents,
--   price_warning si prix > 12 % de l'aide, recalcule final_price_cents.
--   Ne FIGE PAS le prix. No-op si déjà figé.
-- ---------------------------------------------------------------------------
create or replace function public.price_dossier(
  p_dossier_id uuid,
  p_estimated_aid_cents integer default null
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d public.dossiers;
  t public.pricing_tiers;
begin
  perform set_config('app.allow_pricing_write', 'on', true);

  select * into d from public.dossiers where id = p_dossier_id for update;
  if not found then
    raise exception 'Dossier % introuvable', p_dossier_id using errcode = 'no_data_found';
  end if;

  -- Contrôle de propriété : SECURITY DEFINER contourne la RLS, donc on vérifie
  -- ici que l'appelant possède le dossier. auth.uid() null = service-role → OK.
  if auth.uid() is not null and not exists (
    select 1 from public.artisans a
    where a.id = d.artisan_id and a.user_id = auth.uid()
  ) then
    raise exception 'Accès refusé au dossier %', p_dossier_id
      using errcode = 'insufficient_privilege';
  end if;

  -- Prix figé : on ne retarife plus (le palier reste locked même si l'aide bouge).
  if d.price_locked_at is not null then
    return d;
  end if;

  -- Aide fournie par l'appelant (recalculée serveur depuis le barème) : elle fait
  -- foi et écrase la valeur en base. Le client ne peut pas la falsifier : cette
  -- fonction est la seule voie autorisée à écrire estimated_aid_cents.
  if p_estimated_aid_cents is not null then
    d.estimated_aid_cents := p_estimated_aid_cents;
  end if;

  if d.estimated_aid_cents is null then
    raise exception 'estimated_aid_cents requis pour tarifer le dossier %', p_dossier_id;
  end if;

  select * into t
  from public.pricing_tiers
  where active
    and d.estimated_aid_cents >= aid_min_cents
    and (aid_max_cents is null or d.estimated_aid_cents <= aid_max_cents)
  order by aid_min_cents
  limit 1;
  if not found then
    raise exception 'Aucun palier actif pour une aide de % cents', d.estimated_aid_cents;
  end if;

  update public.dossiers
     set estimated_aid_cents = d.estimated_aid_cents,
         tier_id           = t.id,
         base_price_cents  = t.price_cents,
         -- garde-fou : signale (sans bloquer) si le forfait dépasse 12 % de l'aide
         price_warning     = (t.price_cents::numeric > 0.12 * d.estimated_aid_cents),
         final_price_cents = greatest(
                               t.price_cents - coalesce(discount_cents, 0)
                                             - coalesce(credit_applied_cents, 0), 0),
         status            = case when status = 'draft' then 'priced'::dossier_billing_status
                                  else status end
   where id = p_dossier_id
   returning * into d;

  return d;
end $$;

-- ---------------------------------------------------------------------------
-- apply_referral_code(referee_id, code)
--   Valide (pas d'auto-parrainage, filleul sans dossier déjà payé, pas de
--   double parrainage), crée la ligne referrals en 'pending' et applique la
--   remise −30 € sur le 1er dossier (le plus ancien non payé) du filleul.
--   Retourne la ligne referrals créée (status renseigne le résultat).
-- ---------------------------------------------------------------------------
create or replace function public.apply_referral_code(p_referee_id uuid, p_code text)
returns public.referrals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer public.artisans;
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

  select * into v_referrer from public.artisans where referral_code = upper(trim(p_code));
  if not found then
    raise exception 'Code parrain % inconnu', p_code using errcode = 'no_data_found';
  end if;

  -- Auto-parrainage : enregistré en self_blocked, pas de remise.
  if v_referrer.id = p_referee_id then
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

  -- Un seul parrainage par filleul (contrainte unique referee_id).
  if exists (select 1 from public.referrals where referee_id = p_referee_id) then
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

-- ---------------------------------------------------------------------------
-- claim_referee_discount(dossier_id)
--   Réclame la remise filleul (−30 €) pour CE dossier, si un parrainage pending
--   n'a pas encore consommé sa remise. Consommation UNIQUE : le parrainage lie
--   sa remise à un seul dossier (referee_first_dossier_id). À appeler au
--   checkout d'un dossier PAYANT (le 1er dossier offert n'y passe jamais). No-op
--   si prix figé. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.claim_referee_discount(p_dossier_id uuid)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d public.dossiers;
  v_ref_id uuid;
  c_discount constant integer := 3000;  -- 30 €
begin
  perform set_config('app.allow_pricing_write', 'on', true);

  select * into d from public.dossiers where id = p_dossier_id for update;
  if not found then
    raise exception 'Dossier % introuvable', p_dossier_id using errcode = 'no_data_found';
  end if;

  -- Contrôle de propriété (cf. price_dossier).
  if auth.uid() is not null and not exists (
    select 1 from public.artisans a
    where a.id = d.artisan_id and a.user_id = auth.uid()
  ) then
    raise exception 'Accès refusé au dossier %', p_dossier_id
      using errcode = 'insufficient_privilege';
  end if;

  -- Prix figé : on n'y touche plus.
  if d.price_locked_at is not null then
    return d;
  end if;

  -- Réclame la remise pour ce dossier si un parrainage pending ne l'a pas déjà
  -- liée ailleurs.
  if coalesce(d.discount_cents, 0) = 0 then
    update public.referrals
       set referee_first_dossier_id = p_dossier_id
     where referee_id = d.artisan_id
       and status = 'pending'
       and referee_first_dossier_id is null
     returning id into v_ref_id;

    if found then
      d.discount_cents := c_discount;
    end if;
  end if;

  update public.dossiers
     set discount_cents    = d.discount_cents,
         final_price_cents = greatest(
                               coalesce(base_price_cents, 0) - coalesce(d.discount_cents, 0)
                                 - coalesce(credit_applied_cents, 0), 0)
   where id = p_dossier_id
   returning * into d;

  return d;
end $$;

-- ---------------------------------------------------------------------------
-- apply_credits_to_dossier(dossier_id)
--   Consomme les crédits ACTIFS non expirés du propriétaire du dossier, en
--   FIFO par date d'expiration, sur final_price_cents. Ré-exécutable : on
--   annule d'abord les applications précédentes de CE dossier (grand-livre),
--   puis on ré-applique. Interdit une fois le prix figé.
-- ---------------------------------------------------------------------------
create or replace function public.apply_credits_to_dossier(p_dossier_id uuid)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d         public.dossiers;
  v_credit  public.referral_credits;
  v_app     public.credit_applications;
  v_target  integer;   -- reste à couvrir (base − discount)
  v_applied integer := 0;
  v_take    integer;
begin
  perform set_config('app.allow_pricing_write', 'on', true);

  select * into d from public.dossiers where id = p_dossier_id for update;
  if not found then
    raise exception 'Dossier % introuvable', p_dossier_id using errcode = 'no_data_found';
  end if;

  -- Contrôle de propriété (cf. price_dossier). Empêche de consommer les crédits
  -- ou modifier le prix d'un dossier qui n'appartient pas à l'appelant.
  if auth.uid() is not null and not exists (
    select 1 from public.artisans a
    where a.id = d.artisan_id and a.user_id = auth.uid()
  ) then
    raise exception 'Accès refusé au dossier %', p_dossier_id
      using errcode = 'insufficient_privilege';
  end if;

  if d.price_locked_at is not null then
    raise exception 'Dossier % déjà payé : crédits non modifiables', p_dossier_id
      using errcode = 'check_violation';
  end if;
  if d.base_price_cents is null then
    raise exception 'Dossier % non tarifé (appeler price_dossier avant)', p_dossier_id
      using errcode = 'check_violation';
  end if;

  -- 1) Annuler les applications précédentes de ce dossier (idempotence).
  for v_app in
    select * from public.credit_applications where dossier_id = p_dossier_id for update
  loop
    update public.referral_credits
       set consumed_cents = consumed_cents - v_app.amount_cents,
           status = case when status = 'consumed' then 'active' else status end
     where id = v_app.credit_id;
  end loop;
  delete from public.credit_applications where dossier_id = p_dossier_id;

  -- 2) Cible = prix après remise filleul, avant crédits.
  v_target := greatest(d.base_price_cents - coalesce(d.discount_cents, 0), 0);

  -- 3) FIFO par expiration (la plus proche d'abord), crédits vivants uniquement.
  for v_credit in
    select * from public.referral_credits
    where artisan_id = d.artisan_id
      and status = 'active'
      and expires_at > now()
      and amount_cents - consumed_cents > 0
    order by expires_at asc, issued_at asc
    for update
  loop
    exit when v_applied >= v_target;
    v_take := least(v_credit.amount_cents - v_credit.consumed_cents, v_target - v_applied);

    update public.referral_credits
       set consumed_cents = consumed_cents + v_take,
           status = case when consumed_cents + v_take >= amount_cents
                         then 'consumed'::referral_credit_status else status end
     where id = v_credit.id;

    insert into public.credit_applications (credit_id, dossier_id, amount_cents)
    values (v_credit.id, p_dossier_id, v_take);

    v_applied := v_applied + v_take;
  end loop;

  update public.dossiers
     set credit_applied_cents = v_applied,
         final_price_cents    = greatest(v_target - v_applied, 0)
   where id = p_dossier_id
   returning * into d;

  perform public.refresh_credit_balance(d.artisan_id);
  return d;
end $$;

-- ---------------------------------------------------------------------------
-- confirm_dossier_payment(dossier_id)
--   Passe le dossier en 'paid', FIGE le prix, puis déclenche la récompense
--   parrain si c'est le 1er dossier payé d'un filleul lié à un referral pending.
--   Idempotent : no-op si déjà figé ; le crédit ne peut être émis qu'une fois
--   (referral.status = 'pending' requis + unique(source_referral_id)).
-- ---------------------------------------------------------------------------
create or replace function public.confirm_dossier_payment(p_dossier_id uuid)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d              public.dossiers;
  v_ref          public.referrals;
  v_is_first     boolean;
  v_reward_count integer;
  c_credit  constant integer := 5000;  -- 50 €
  c_cap     constant integer := 3;     -- récompenses max par trimestre glissant
begin
  perform set_config('app.allow_pricing_write', 'on', true);

  select * into d from public.dossiers where id = p_dossier_id for update;
  if not found then
    raise exception 'Dossier % introuvable', p_dossier_id using errcode = 'no_data_found';
  end if;

  -- Idempotence : déjà payé/figé → on renvoie l'état courant sans rien refaire.
  if d.price_locked_at is not null then
    return d;
  end if;

  -- Est-ce le 1er dossier PAYÉ de cet artisan ? (avant de marquer celui-ci)
  v_is_first := not exists (
    select 1 from public.dossiers
    where artisan_id = d.artisan_id
      and id <> d.id
      and status in ('paid', 'deposited', 'paid_out')
  );

  update public.dossiers
     set status          = 'paid',
         price_locked_at  = now(),
         final_price_cents = coalesce(final_price_cents, base_price_cents)
   where id = p_dossier_id
   returning * into d;

  -- Récompense parrain : uniquement au 1er dossier payé du filleul.
  if v_is_first then
    select * into v_ref
    from public.referrals
    where referee_id = d.artisan_id
      and status = 'pending'
    for update;

    if found then
      update public.referrals
         set referee_first_dossier_id = coalesce(referee_first_dossier_id, d.id)
       where id = v_ref.id;

      -- Cap trimestriel GLISSANT : récompenses du parrain sur les 90 derniers jours.
      select count(*) into v_reward_count
      from public.referrals
      where referrer_id = v_ref.referrer_id
        and status = 'rewarded'
        and rewarded_at > now() - interval '90 days';

      if v_reward_count < c_cap then
        insert into public.referral_credits
          (artisan_id, amount_cents, source_referral_id, issued_at, expires_at)
        values
          (v_ref.referrer_id, c_credit, v_ref.id, now(), now() + interval '12 months')
        on conflict (source_referral_id) do nothing;  -- double-ceinture idempotence

        update public.referrals
           set status = 'rewarded', rewarded_at = now()
         where id = v_ref.id;

        perform public.refresh_credit_balance(v_ref.referrer_id);
      else
        -- Plafond atteint : parrainage enregistré, crédit NON émis.
        update public.referrals set status = 'capped' where id = v_ref.id;
      end if;
    end if;
  end if;

  return d;
end $$;

-- ---------------------------------------------------------------------------
-- expire_old_credits()
--   Passe en 'expired' tout crédit actif dont l'échéance est atteinte, et
--   rafraîchit le solde des artisans concernés. À appeler périodiquement
--   (pg_cron si dispo, sinon route API cron). Retourne le nombre de crédits
--   expirés.
-- ---------------------------------------------------------------------------
create or replace function public.expire_old_credits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_artisans uuid[];
  v_count    integer;
begin
  with upd as (
    update public.referral_credits
       set status = 'expired'
     where status = 'active'
       and expires_at <= now()
     returning artisan_id
  )
  select count(*), array_agg(distinct artisan_id)
    into v_count, v_artisans
  from upd;

  -- Rafraîchit le solde de chaque artisan ayant vu au moins un crédit expirer.
  if v_artisans is not null then
    perform public.refresh_credit_balance(x) from unnest(v_artisans) as x;
  end if;

  return coalesce(v_count, 0);
end $$;

-- =============================================================================
-- Exposition RPC (PostgREST). Le service-role et les fonctions restent la
-- source de vérité argent ; on expose l'exécution aux rôles applicatifs.
-- =============================================================================
grant execute on function public.price_dossier(uuid, integer)   to authenticated, service_role;
grant execute on function public.apply_referral_code(uuid, text) to authenticated, service_role;
grant execute on function public.claim_referee_discount(uuid)   to authenticated, service_role;
grant execute on function public.apply_credits_to_dossier(uuid)  to authenticated, service_role;
grant execute on function public.confirm_dossier_payment(uuid)   to service_role;   -- paiement = webhook only
grant execute on function public.expire_old_credits()            to service_role;
