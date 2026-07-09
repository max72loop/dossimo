-- =============================================================================
-- Dossimo — Tests d'intégration pricing + parrainage (migrations 0012/0013)
-- =============================================================================
-- Exécuter APRÈS 0012 et 0013, sur une base de test :
--   psql "$DATABASE_URL" -f supabase/tests/0013_pricing_parrainage_test.sql
-- Tout tourne dans une transaction ROLLBACKée : aucune donnée n'est laissée.
-- Chaque échec lève une exception 'FAIL: …' ; sinon on voit 'ALL TESTS PASSED'.
-- =============================================================================

begin;

do $$
declare
  a_ref   uuid;  -- parrain
  a_fil   uuid;  -- filleul (parcours récompensé)
  a_cap   uuid;  -- parrain saturé (test du cap)
  a_h     uuid;  -- filleul du parrain saturé
  a_dummy uuid;
  code_ref text;
  d_warn  uuid;  -- dossier warning >12 %
  d_ok    uuid;  -- dossier sans warning
  d_fil_old uuid; -- 1er dossier (offert) du filleul récompensé
  d_fil   uuid;  -- 1er dossier PAYANT du filleul récompensé
  d_h     uuid;  -- dossier du filleul capé
  dd      public.dossiers;
  r       public.referrals;
  v_disc  int;
  v_final int;
  v_bal   int;
  v_n     int;
  v_status public.referral_status;
begin
  -- --- Fixtures artisans -----------------------------------------------------
  insert into public.artisans (entreprise, nom, prenom, email)
    values ('Parrain SARL', 'Parrain', 'P', 'parrain@test.fr') returning id into a_ref;
  select referral_code into code_ref from public.artisans where id = a_ref;
  if code_ref is null then raise exception 'FAIL: code parrain non généré'; end if;

  -- =========================================================================
  -- TEST 1 — Garde-fou prix > 12 % de l'aide estimée
  -- =========================================================================
  insert into public.dossiers (artisan_id, dispositif, type_travaux, estimated_aid_cents)
    values (a_ref, 'cee', 'isolation', 30000) returning id into d_warn;  -- 300 €
  dd := public.price_dossier(d_warn);
  if dd.base_price_cents <> 4900 then raise exception 'FAIL T1: palier Essentiel attendu'; end if;
  if not dd.price_warning then raise exception 'FAIL T1: price_warning attendu (49€ > 12%% de 300€)'; end if;

  insert into public.dossiers (artisan_id, dispositif, type_travaux, estimated_aid_cents)
    values (a_ref, 'cee', 'isolation', 90000) returning id into d_ok;    -- 900 €
  dd := public.price_dossier(d_ok);
  if dd.price_warning then raise exception 'FAIL T1: pas de warning attendu (49€ < 12%% de 900€)'; end if;
  raise notice 'T1 OK — garde-fou 12%%';

  -- =========================================================================
  -- TEST 2 — Auto-parrainage bloqué (status self_blocked, sans remise)
  -- =========================================================================
  r := public.apply_referral_code(a_ref, code_ref);
  if r.status <> 'self_blocked' then raise exception 'FAIL T2: self_blocked attendu, obtenu %', r.status; end if;
  raise notice 'T2 OK — auto-parrainage bloqué';

  -- =========================================================================
  -- TEST 3 — Prix figé après paiement (price_dossier no-op ensuite)
  -- =========================================================================
  dd := public.confirm_dossier_payment(d_warn);
  if dd.status <> 'paid' then raise exception 'FAIL T3: statut paid attendu'; end if;
  if dd.price_locked_at is null then raise exception 'FAIL T3: price_locked_at attendu'; end if;
  dd := public.price_dossier(d_warn);  -- doit être un no-op
  if dd.base_price_cents <> 4900 then raise exception 'FAIL T3: prix retarifé alors qu''il est figé'; end if;

  -- Garde-fou trigger : écriture directe des colonnes prix refusée (hors fonction)
  update public.dossiers set final_price_cents = 1 where id = d_ok;
  select final_price_cents into v_n from public.dossiers where id = d_ok;
  if v_n = 1 then raise exception 'FAIL T3: le trigger n''a pas protégé final_price_cents'; end if;
  raise notice 'T3 OK — prix figé + garde-fou écriture';

  -- =========================================================================
  -- TEST 4 — Crédit expiré NON appliqué, puis expiré par le job
  -- =========================================================================
  insert into public.referral_credits (artisan_id, amount_cents, issued_at, expires_at)
    values (a_ref, 5000, now() - interval '13 months', now() - interval '1 day');
  -- d_ok est tarifé (4900). On tente d'y appliquer les crédits :
  dd := public.apply_credits_to_dossier(d_ok);
  if dd.credit_applied_cents <> 0 then raise exception 'FAIL T4: crédit expiré appliqué'; end if;

  v_n := public.expire_old_credits();
  if v_n < 1 then raise exception 'FAIL T4: expire_old_credits n''a rien expiré'; end if;
  select credit_balance_cents into v_bal from public.artisans where id = a_ref;
  if v_bal <> 0 then raise exception 'FAIL T4: solde devrait exclure le crédit expiré, obtenu %', v_bal; end if;
  raise notice 'T4 OK — crédit expiré ignoré';

  -- =========================================================================
  -- TEST 5 — Remise filleul sur le 1er dossier PAYANT + récompense parrain 50 €
  --   Le 1er dossier de l'artisan est offert : la remise −30 € se pose sur le
  --   1er dossier payant (réclamée au checkout via claim_referee_discount).
  -- =========================================================================
  insert into public.artisans (entreprise, nom, prenom, email)
    values ('Filleul SARL', 'Filleul', 'F', 'filleul@test.fr') returning id into a_fil;
  -- 1er dossier (offert / le plus ancien).
  insert into public.dossiers (artisan_id, dispositif, type_travaux, estimated_aid_cents, created_at)
    values (a_fil, 'cee', 'isolation', 120000, now() - interval '1 day') returning id into d_fil_old;
  -- 2e dossier = 1er PAYANT (Pivot 149 €).
  insert into public.dossiers (artisan_id, dispositif, type_travaux, estimated_aid_cents)
    values (a_fil, 'cee', 'isolation', 120000) returning id into d_fil;

  r := public.apply_referral_code(a_fil, code_ref);
  if r.status <> 'pending' then raise exception 'FAIL T5: referral pending attendu'; end if;
  -- La remise n'est PAS posée à la saisie du code.
  select discount_cents into v_disc from public.dossiers where id = d_fil;
  if v_disc <> 0 then raise exception 'FAIL T5: remise ne doit pas être posée à la saisie, obtenu %', v_disc; end if;

  -- Checkout du 1er dossier payant : tarif + réclamation de la remise.
  dd := public.price_dossier(d_fil);
  if dd.base_price_cents <> 14900 then raise exception 'FAIL T5: palier Pivot attendu'; end if;
  dd := public.claim_referee_discount(d_fil);
  if dd.discount_cents <> 3000 then raise exception 'FAIL T5: remise 30€ non réclamée, obtenu %', dd.discount_cents; end if;
  if dd.final_price_cents <> 11900 then raise exception 'FAIL T5: final 119€ attendu, obtenu %', dd.final_price_cents; end if;

  -- Le filleul paie son 1er dossier payant → parrain récompensé
  dd := public.confirm_dossier_payment(d_fil);
  select status into v_status from public.referrals where referee_id = a_fil;
  if v_status <> 'rewarded' then raise exception 'FAIL T5: referral rewarded attendu, obtenu %', v_status; end if;
  select count(*) into v_n from public.referral_credits
    where artisan_id = a_ref and status = 'active' and source_referral_id is not null;
  if v_n <> 1 then raise exception 'FAIL T5: 1 crédit parrain actif attendu, obtenu %', v_n; end if;
  select credit_balance_cents into v_bal from public.artisans where id = a_ref;
  if v_bal <> 5000 then raise exception 'FAIL T5: solde parrain 50€ attendu, obtenu %', v_bal; end if;

  -- Idempotence : reconfirmer ne double PAS le crédit
  dd := public.confirm_dossier_payment(d_fil);
  select count(*) into v_n from public.referral_credits where artisan_id = a_ref and source_referral_id is not null;
  if v_n <> 1 then raise exception 'FAIL T5: crédit dupliqué (non idempotent), obtenu %', v_n; end if;
  raise notice 'T5 OK — remise filleul + récompense parrain + idempotence';

  -- =========================================================================
  -- TEST 6 — Cap trimestriel glissant : 4e filleul récompensable → capped
  -- =========================================================================
  insert into public.artisans (entreprise, nom, prenom, email)
    values ('Parrain Cap', 'Cap', 'C', 'cap@test.fr') returning id into a_cap;

  -- 3 récompenses déjà émises dans les 90 derniers jours (referrals directs)
  for v_n in 1..3 loop
    insert into public.artisans (entreprise, nom, prenom, email)
      values ('Dummy', 'D', 'D', 'dummy' || v_n || '@test.fr') returning id into a_dummy;
    insert into public.referrals (referrer_id, referee_id, code_used, status, rewarded_at)
      values (a_cap, a_dummy, 'X', 'rewarded', now() - (v_n || ' days')::interval);
  end loop;

  -- 4e filleul : parrainage pending puis paiement → doit être capped, sans crédit
  insert into public.artisans (entreprise, nom, prenom, email)
    values ('Filleul Cap', 'H', 'H', 'h@test.fr') returning id into a_h;
  select referral_code into code_ref from public.artisans where id = a_cap;
  insert into public.dossiers (artisan_id, dispositif, type_travaux, estimated_aid_cents)
    values (a_h, 'cee', 'isolation', 120000) returning id into d_h;
  dd := public.price_dossier(d_h);
  r := public.apply_referral_code(a_h, code_ref);
  if r.status <> 'pending' then raise exception 'FAIL T6: referral pending attendu'; end if;

  dd := public.confirm_dossier_payment(d_h);
  select status into v_status from public.referrals where referee_id = a_h;
  if v_status <> 'capped' then raise exception 'FAIL T6: capped attendu (4e du trimestre), obtenu %', v_status; end if;
  select count(*) into v_n from public.referral_credits
    where artisan_id = a_cap and source_referral_id is not null;
  if v_n <> 0 then raise exception 'FAIL T6: aucun crédit ne doit être émis au-delà du cap, obtenu %', v_n; end if;
  raise notice 'T6 OK — cap trimestriel glissant';

  raise notice '=====================================';
  raise notice 'ALL TESTS PASSED';
  raise notice '=====================================';
end $$;

rollback;
