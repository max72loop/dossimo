-- =============================================================================
-- Dossimo — Test des contraintes du canal téléphone (migration 0052)
-- =============================================================================
-- Exécuter APRÈS 0052, sur une base de test :
--   psql "$DATABASE_URL" -f supabase/tests/0052_canal_telephone_test.sql
-- Tout tourne dans une transaction ROLLBACKée : aucune donnée n'est laissée.
-- Chaque échec lève une exception 'FAIL: …' ; sinon on voit 'ALL TESTS PASSED'.
--
-- Ce que ce test protège : une réservation téléphone n'a de valeur que si elle
-- rend le contact invisible aux DEUX systèmes d'envoi. Chacun le filtre à sa
-- façon, et rien dans le code ne relie les deux filtres — seul ce test le dit.
-- =============================================================================

begin;

do $$
declare
  v_n int;
begin
  -- --- Fixtures --------------------------------------------------------------
  insert into public.prospects_dossimo (place_id, name, emails, source)
  values
    ('test:libre',    'LIBRE SARL',    array['libre@test.fr'],    'test'),
    ('test:tel',      'TELEPHONE SARL', array['tel@test.fr'],     'test');

  insert into public.prospects (email, entreprise, source, notes)
  values
    ('libre@test.fr', 'LIBRE SARL',     'test', 'import prospects_dossimo · place_id=test:libre'),
    ('tel@test.fr',   'TELEPHONE SARL', 'test', 'import prospects_dossimo · place_id=test:tel');

  -- =========================================================================
  -- TEST 1 — Les valeurs légitimes de `canal` sont acceptées
  -- =========================================================================
  update public.prospects_dossimo set canal = 'telephone' where place_id = 'test:tel';
  update public.prospects_dossimo set canal = 'email'     where place_id = 'test:libre';
  update public.prospects_dossimo set canal = null        where place_id = 'test:libre';

  -- =========================================================================
  -- TEST 2 — Une faute de frappe est REFUSÉE
  -- Sans la contrainte, 'tel' passait et rendait le contact intouchable en
  -- silence : invisible des lots (filtrés email/whatsapp) ET du tirage
  -- (filtré `canal is null`).
  -- =========================================================================
  begin
    update public.prospects_dossimo set canal = 'tel' where place_id = 'test:libre';
    raise exception 'FAIL: canal inconnu accepté';
  exception when check_violation then null;
  end;

  -- =========================================================================
  -- TEST 3 — Le contact réservé sort du TIRAGE du sprint et de l'IMPORT vers
  -- la file automatique, qui filtrent tous deux sur `canal is null`.
  -- =========================================================================
  select count(*) into v_n from public.prospects_dossimo
  where place_id in ('test:libre', 'test:tel') and opt_out is not true and canal is null;
  if v_n <> 1 then
    raise exception 'FAIL: le tirage voit % contacts au lieu du seul contact libre', v_n;
  end if;

  -- =========================================================================
  -- TEST 4 — Il sort aussi des LOTS du sprint manuel (`lot.ts` / `pilotage.ts`,
  -- qui filtrent sur canal = 'whatsapp' | 'email'). Le téléphone n'est pas un
  -- troisième bras de l'A/B : il ne doit apparaître dans aucun des deux.
  -- =========================================================================
  select count(*) into v_n from public.prospects_dossimo
  where place_id in ('test:libre', 'test:tel') and canal in ('whatsapp', 'email');
  if v_n <> 0 then
    raise exception 'FAIL: % contact(s) téléphone visibles dans les lots A/B', v_n;
  end if;

  -- =========================================================================
  -- TEST 5 — `reserve_telephone` est accepté et sort le contact de la file
  -- automatique, que `preparerFile` sélectionne sur `statut = 'nouveau'`.
  -- =========================================================================
  update public.prospects set statut = 'reserve_telephone'
  where split_part(notes, 'place_id=', 2) = 'test:tel';

  select count(*) into v_n from public.prospects
  where email in ('libre@test.fr', 'tel@test.fr') and statut = 'nouveau';
  if v_n <> 1 then
    raise exception 'FAIL: preparerFile voit % prospects au lieu du seul contact libre', v_n;
  end if;

  -- =========================================================================
  -- TEST 6 — Un statut inconnu reste REFUSÉ : la 0052 élargit la contrainte,
  -- elle ne la supprime pas.
  -- =========================================================================
  begin
    update public.prospects set statut = 'reserve_pigeon' where email = 'tel@test.fr';
    raise exception 'FAIL: statut inconnu accepté';
  exception when check_violation then null;
  end;

  -- =========================================================================
  -- TEST 7 — La réservation est RÉVERSIBLE, contrairement à « exclu » : rendre
  -- le contact à la file le remet exactement dans son état d'origine.
  -- =========================================================================
  update public.prospects_dossimo set canal = null where place_id = 'test:tel';
  update public.prospects set statut = 'nouveau'
  where split_part(notes, 'place_id=', 2) = 'test:tel';

  select count(*) into v_n from public.prospects
  where email in ('libre@test.fr', 'tel@test.fr') and statut = 'nouveau';
  if v_n <> 2 then
    raise exception 'FAIL: la remise en file n''a rendu que % prospect(s)', v_n;
  end if;

  -- =========================================================================
  -- TEST 8 — Tant qu'aucun appel n'est passé, le contact reste « jamais
  -- contacté » au pilotage (`ChiffresFichier`, qui ignore le canal) ; poser
  -- `date_envoi` le fait basculer en contacté, comme un envoi manuel.
  -- =========================================================================
  update public.prospects_dossimo set canal = 'telephone' where place_id = 'test:tel';

  select count(*) into v_n from public.prospects_dossimo
  where place_id = 'test:tel' and contact_auto_le is null and date_envoi is null;
  if v_n <> 1 then
    raise exception 'FAIL: le contact réservé n''est pas compté comme jamais contacté';
  end if;

  update public.prospects_dossimo set date_envoi = current_date where place_id = 'test:tel';

  select count(*) into v_n from public.prospects_dossimo
  where place_id = 'test:tel' and date_envoi is not null;
  if v_n <> 1 then
    raise exception 'FAIL: l''appel marqué ne compte pas comme contact';
  end if;

  raise notice 'ALL TESTS PASSED';
end $$;

rollback;
