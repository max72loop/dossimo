-- =============================================================================
-- Dossimo — Profils de revenus et barèmes MaPrimeRénov' 2026 (migration 0046)
-- =============================================================================
-- À exécuter après `npx supabase db reset`. Transaction rollbackée : ce test
-- ne laisse aucune donnée. Chaque geste concret est vérifié pour les quatre
-- profils : bleu, jaune, violet, puis absence volontaire du rose en MPR.
-- =============================================================================

begin;

create temporary table expected_mpr (
  geste text not null,
  mode text not null check (mode in ('par_m2', 'forfait')),
  bleu numeric not null,
  jaune numeric not null,
  violet numeric not null
) on commit drop;

-- Cinq familles de gestes : isolation des combles (deux variantes techniques),
-- PAC air/eau, CET, chauffage au bois et chauffe-eau solaire individuel.
insert into expected_mpr (geste, mode, bleu, jaune, violet) values
  ('combles_perdus',     'par_m2',  25, 20, 15),
  ('rampants_toiture',   'par_m2',  25, 20, 15),
  ('pac_air_eau',        'forfait', 5000, 4000, 3000),
  ('cet',                'forfait', 1200, 800, 400),
  ('bois',               'forfait', 2500, 2000, 1000),
  ('solaire_thermique',  'forfait', 4000, 3000, 2000);

do $$
declare
  attendu expected_mpr%rowtype;
  condition jsonb;
  montants jsonb;
  obtenu numeric;
  profil text;
  valeur_attendue numeric;
  n integer;
begin
  -- TEST 1 — Chaque geste porte bleu, jaune et violet au montant attendu.
  for attendu in select * from expected_mpr order by geste loop
    select r.condition_json into condition
    from public.regles_metier r
    where r.dispositif = 'maprimerenov'
      and r.type_travaux = attendu.geste
      and r.actif
    order by r.version desc
    limit 1;

    if condition is null then
      raise exception 'FAIL T1: règle MPR active absente pour %', attendu.geste;
    end if;

    montants := condition #> array['prime', attendu.mode];
    if montants is null then
      raise exception 'FAIL T1: barème %.% absent', attendu.geste, attendu.mode;
    end if;

    foreach profil in array array['grande_precarite', 'precaire', 'intermediaire'] loop
      valeur_attendue := case profil
        when 'grande_precarite' then attendu.bleu
        when 'precaire' then attendu.jaune
        else attendu.violet
      end;
      obtenu := (montants ->> profil)::numeric;
      if obtenu is distinct from valeur_attendue then
        raise exception 'FAIL T1: %.% attendu %, obtenu %',
          attendu.geste, profil, valeur_attendue, obtenu;
      end if;
    end loop;

    -- Rose : absence intentionnelle, jamais le montant du violet par repli.
    if montants ? 'superieur' then
      raise exception 'FAIL T1: le profil rose ne doit pas avoir de forfait MPR pour %',
        attendu.geste;
    end if;
    if montants ? 'classique' then
      raise exception 'FAIL T1: ancienne clé classique encore présente pour %',
        attendu.geste;
    end if;
  end loop;
  raise notice 'T1 OK — barèmes MPR vérifiés par profil et par geste';

  -- TEST 2 — CEE conserve violet ET rose au même montant. Le CESI est exclu :
  -- sa valorisation dépend des kWh cumac et du prix de l''obligé, aucun montant
  -- en euros n'est donc inventé dans regles_metier.
  select count(*) into n
  from public.regles_metier r
  where r.dispositif = 'cee'
    and r.actif
    and r.type_travaux in (
      'combles_perdus', 'rampants_toiture', 'pac_air_eau', 'cet', 'bois'
    );

  if n <> 5 then
    raise exception 'FAIL T2: 5 barèmes CEE actifs attendus, obtenu %', n;
  end if;

  select count(*) into n
  from (
    select distinct on (r.type_travaux)
      r.type_travaux,
      coalesce(
        r.condition_json #> '{prime,forfait}',
        r.condition_json #> '{prime,par_m2}'
      ) as montants
    from public.regles_metier r
    where r.dispositif = 'cee'
      and r.actif
      and r.type_travaux in (
        'combles_perdus', 'rampants_toiture', 'pac_air_eau', 'cet', 'bois'
      )
    order by r.type_travaux, r.version desc
  ) courantes
  where montants is null
     or not (montants ? 'intermediaire')
     or not (montants ? 'superieur')
     or montants ->> 'intermediaire' is distinct from montants ->> 'superieur'
     or montants ? 'classique';

  if n <> 0 then
    raise exception 'FAIL T2: % barème(s) CEE confondent ou omettent violet/rose', n;
  end if;
  raise notice 'T2 OK — violet et rose ont le même barème CEE par geste';

  raise notice '=====================================';
  raise notice 'ALL TESTS PASSED';
  raise notice '=====================================';
end $$;

rollback;
