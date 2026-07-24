-- Ferme le farming de crédits par auto-parrainage via un second compte.
--
-- LE PROBLÈME. `apply_referral_code` (0013) ne bloque l'auto-parrainage que si
-- referrer_id = referee_id, soit la MÊME ligne `artisans`. Un artisan qui crée un
-- 2e compte (autre e-mail) et y saisit son propre code contourne le garde-fou :
-- au 1er dossier payant du 2e compte, le 1er compte reçoit 50 € de crédit et le
-- 2e conserve la remise filleul. Boucle rentable, plafonnée seulement à 3
-- récompenses / trimestre (150 €), les crédits étant ensuite dépensés sur de
-- vrais dossiers.
--
-- LE CORRECTIF. On refuse aussi le parrainage entre deux comptes qui partagent le
-- même SIRET : l'artisan ne change pas d'entreprise en changeant de boîte mail.
-- Comparaison sur les seuls chiffres (regexp_replace `\D`), et UNIQUEMENT si les
-- deux SIRET sont renseignés : un SIRET absent (défaut à l'inscription) reste une
-- donnée inconnue, on ne bloque jamais un parrainage légitime sur une donnée
-- manquante. Enregistré en 'self_blocked', comme l'auto-parrainage direct : même
-- statut déjà admis par la table, aucune remise.
--
-- Règle 4 (AGENTS.md) : reproduit l'état COURANT de la fonction (0013, jamais
-- redéfinie depuis) avec le seul garde-fou SIRET ajouté. `create or replace`
-- conserve les privilèges existants — aucun revoke/grant à refaire.

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

-- PostgREST met le schéma en cache : le recharger pour exposer la nouvelle
-- définition immédiatement (README §4).
notify pgrst, 'reload schema';
