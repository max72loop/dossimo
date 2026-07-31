-- =============================================================================
-- Dossimo — Test de l'auto-parrainage consigné (migration 0055)
-- =============================================================================
-- Exécuter APRÈS 0055, sur une base de test :
--   psql "$DATABASE_URL" -f supabase/tests/0055_parrainage_auto_test.sql
-- Tout tourne dans une transaction ROLLBACKée : aucune donnée n'est laissée.
-- Chaque échec lève une exception 'FAIL: …' ; sinon on voit 'ALL TESTS PASSED'.
--
-- Ce que ce test protège : la tentative d'auto-parrainage doit laisser une trace
-- SANS coûter au filleul son unique créneau de parrainage. Les deux moitiés se
-- tiennent, et aucune ne se voit dans le code : la contrainte, l'index partiel et
-- le contrôle « déjà parrainé » de la fonction sont dans trois objets différents.
-- T3 est le test qui aurait dû exister en 0048 : la branche SIRET écrivait sa
-- ligne, donc verrouillait déjà le filleul pour de bon.
-- =============================================================================

begin;

do $$
declare
  a_self  uuid;  -- artisan qui saisit son propre code
  a_ref   uuid;  -- parrain légitime
  a_jum   uuid;  -- second compte, même SIRET que a_ref
  code_self text;
  code_ref  text;
  r       public.referrals;
  v_n     int;
begin
  -- --- Fixtures --------------------------------------------------------------
  insert into public.artisans (entreprise, nom, prenom, email, siret)
    values ('Auto SARL', 'Auto', 'A', 'auto@test.fr', '11111111100011')
    returning id into a_self;
  select referral_code into code_self from public.artisans where id = a_self;

  insert into public.artisans (entreprise, nom, prenom, email, siret)
    values ('Parrain SARL', 'Parrain', 'P', 'parrain-0055@test.fr', '22222222200022')
    returning id into a_ref;
  select referral_code into code_ref from public.artisans where id = a_ref;

  -- =========================================================================
  -- TEST 1 — Auto-parrainage direct : consigné, pas d'exception
  -- =========================================================================
  -- Avant 0055 la contrainte referrals_no_self_chk faisait échouer l'insert et
  -- l'artisan recevait une erreur Postgres brute au lieu du refus métier.
  r := public.apply_referral_code(a_self, code_self);
  if r.status <> 'self_blocked' then
    raise exception 'FAIL T1: self_blocked attendu, obtenu %', r.status;
  end if;
  if r.referrer_id <> a_self or r.referee_id <> a_self then
    raise exception 'FAIL T1: la ligne doit porter les deux fois le même artisan';
  end if;
  raise notice 'T1 OK — auto-parrainage direct consigné';

  -- =========================================================================
  -- TEST 2 — Répétée, la tentative ne s'empile pas
  -- =========================================================================
  r := public.apply_referral_code(a_self, code_self);
  if r.status <> 'self_blocked' then
    raise exception 'FAIL T2: self_blocked attendu au 2e appel, obtenu %', r.status;
  end if;
  select count(*) into v_n from public.referrals
    where referee_id = a_self and status = 'self_blocked';
  if v_n <> 1 then
    raise exception 'FAIL T2: une seule trace attendue, obtenu %', v_n;
  end if;
  raise notice 'T2 OK — tentative répétée idempotente';

  -- =========================================================================
  -- TEST 3 — La tentative bloquée ne consomme PAS le créneau du filleul
  -- =========================================================================
  -- Le cœur du correctif : sans l'index partiel et sans l'exclusion dans la
  -- fonction, une faute de frappe interdirait définitivement tout parrainage.
  r := public.apply_referral_code(a_self, code_ref);
  if r.status <> 'pending' then
    raise exception 'FAIL T3: pending attendu après une tentative bloquée, obtenu %', r.status;
  end if;
  if r.referrer_id <> a_ref then
    raise exception 'FAIL T3: le parrain légitime doit être enregistré';
  end if;
  raise notice 'T3 OK — le créneau du filleul reste disponible';

  -- =========================================================================
  -- TEST 4 — Un vrai parrainage reste unique
  -- =========================================================================
  begin
    r := public.apply_referral_code(a_self, code_ref);
    raise exception 'FAIL T4: un 2e code parrain aurait dû être refusé';
  exception
    when unique_violation then null;  -- attendu
  end;
  raise notice 'T4 OK — un seul parrainage actif par filleul';

  -- =========================================================================
  -- TEST 5 — Branche SIRET (0048) : même trace, même absence de verrou
  -- =========================================================================
  insert into public.artisans (entreprise, nom, prenom, email, siret)
    values ('Parrain SARL bis', 'Parrain', 'P', 'jumeau-0055@test.fr', '2222 2222 200022')
    returning id into a_jum;
  r := public.apply_referral_code(a_jum, code_ref);
  if r.status <> 'self_blocked' then
    raise exception 'FAIL T5: self_blocked attendu (même SIRET), obtenu %', r.status;
  end if;
  select count(*) into v_n from public.referrals
    where referee_id = a_jum and status <> 'self_blocked';
  if v_n <> 0 then
    raise exception 'FAIL T5: aucun parrainage actif ne doit exister, obtenu %', v_n;
  end if;
  raise notice 'T5 OK — branche SIRET consignée sans verrouiller le compte';

  -- =========================================================================
  -- TEST 6 — La contrainte protège toujours un parrainage ACTIF vers soi-même
  -- =========================================================================
  begin
    insert into public.referrals (referrer_id, referee_id, code_used, status)
      values (a_self, a_self, code_self, 'pending');
    raise exception 'FAIL T6: un parrainage pending vers soi-même aurait dû être refusé';
  exception
    when check_violation then null;  -- attendu
  end;
  raise notice 'T6 OK — l''égalité reste interdite hors self_blocked';

  raise notice '=====================================';
  raise notice 'ALL TESTS PASSED';
  raise notice '=====================================';
end $$;

rollback;
