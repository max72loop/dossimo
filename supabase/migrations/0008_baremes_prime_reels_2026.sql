-- Barèmes de prime réels 2026 + correction d'éligibilité MaPrimeRénov'.
--
-- MaPrimeRénov' PAR GESTE (forfaits officiels 2026, Anah) pour l'isolation des
-- combles/toiture et rampants : 25 / 20 / 15 €/m² selon le profil de revenus
-- (très modeste « bleu » / modeste « jaune » / intermédiaire « violet »), mappés
-- sur grande_precarite / precaire / classique.
update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":25,"precaire":20,"classique":15}}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux in ('combles_perdus', 'rampants_toiture');

-- L'isolation du plancher bas N'EST PAS financée en MaPrimeRénov' par geste en
-- 2026 (uniquement en rénovation d'ampleur). On retire la règle : le contrôle
-- signalera « geste non éligible à MaPrimeRénov' ».
delete from public.regles_metier
where dispositif = 'maprimerenov' and type_travaux = 'plancher_bas';

-- CEE : la prime varie selon l'obligé, la zone et le logement. Valeurs
-- INDICATIVES (ordre de grandeur observé 2026), à AJUSTER dans l'admin selon
-- l'offre de l'obligé retenu.
update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":13,"precaire":11,"classique":7}}}'::jsonb
where dispositif = 'cee' and type_travaux in ('combles_perdus', 'rampants_toiture');

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":12,"precaire":10,"classique":6}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'plancher_bas';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":16,"precaire":13,"classique":9}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'murs';
