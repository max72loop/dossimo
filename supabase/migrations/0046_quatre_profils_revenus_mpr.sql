-- Portage des QUATRE profils de revenus de l'Anah dans les barèmes de prime.
--
-- Le modèle interne passait de trois bandes (grande_precarite / precaire /
-- classique, calquées sur le CEE) à quatre (cf. `CategorieRevenus`,
-- src/lib/rules/plafonds.ts) : le `classique` confondait le VIOLET (intermédiaire,
-- éligible MaPrimeRénov' par geste) et le ROSE (supérieur, NON éligible par geste
-- en 2026). Cette migration aligne la DONNÉE sur ce modèle.
--
-- Principe :
--   * MaPrimeRénov' : la clé `classique` (qui valait déjà le forfait VIOLET) devient
--     `intermediaire`, même valeur ; PAS de clé `superieur` — le rose n'a pas de
--     forfait, donc `estimerPrime` renvoie null (« non éligible »), cohérent avec le
--     blocage `avis_mpr_revenus_superieurs` du contrôle avis.
--   * CEE : le dispositif IGNORE la distinction violet / rose. On porte donc la
--     valeur `classique` sur les DEUX nouvelles clés (`intermediaire` ET
--     `superieur`), pour que le rose reste estimé au même tarif.
--
-- Le `||` remplace tout le sous-objet `prime` (même mécanique que 0008). Les autres
-- clés de `condition_json` (tva_taux, seuils…) sont préservées.
--
-- Aucun DROP, aucune fonction touchée, additive. Idempotente : rejouable telle
-- quelle (elle réécrit `prime` à un état fixe).

-- ---------------------------------------------------------------------------
-- MaPrimeRénov' — classique → intermediaire (violet), sans superieur (rose)
-- ---------------------------------------------------------------------------

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":25,"precaire":20,"intermediaire":15}}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux in ('combles_perdus', 'rampants_toiture');

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":5000,"precaire":4000,"intermediaire":3000}}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux = 'pac_air_eau';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":1200,"precaire":800,"intermediaire":400}}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux = 'cet';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":2500,"precaire":2000,"intermediaire":1000}}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux = 'bois';

-- CESI (BAR-TH-101) : ajout du VIOLET (intermediaire) = 2 000 €, laissé de côté par
-- 0042 faute d'un modèle à quatre bandes. Source : guide Anah « Les aides
-- financières en 2026 » (bleu 4 000 / jaune 3 000 / violet 2 000 / rose non
-- éligible, plafond de dépense 7 000 €), cf. 0042 (commentaire lignes 21-26).
update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":4000,"precaire":3000,"intermediaire":2000},"plafond":7000}}'::jsonb
where dispositif = 'maprimerenov' and type_travaux = 'solaire_thermique';

-- ---------------------------------------------------------------------------
-- CEE — classique porté sur intermediaire ET superieur (même tarif)
-- ---------------------------------------------------------------------------

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":13,"precaire":11,"intermediaire":7,"superieur":7}}}'::jsonb
where dispositif = 'cee' and type_travaux in ('combles_perdus', 'rampants_toiture');

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":12,"precaire":10,"intermediaire":6,"superieur":6}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'plancher_bas';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"grande_precarite":16,"precaire":13,"intermediaire":9,"superieur":9}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'murs';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":4500,"precaire":3500,"intermediaire":2500,"superieur":2500}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'pac_air_eau';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":1200,"precaire":900,"intermediaire":600,"superieur":600}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'cet';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"forfait":{"grande_precarite":900,"precaire":700,"intermediaire":500,"superieur":500}}}'::jsonb
where dispositif = 'cee' and type_travaux = 'bois';

-- ---------------------------------------------------------------------------
-- Dossiers existants — precarite déclarée « classique » → « intermediaire »
-- ---------------------------------------------------------------------------
-- Le champ vit dans le JSON (pas de colonne, pas d'enum PG), lu sans validation.
-- Un ancien « classique » recouvrait de fait le violet pour l'estimation : on le
-- lit donc comme `intermediaire` (bande éligible). Un ménage réellement rose reste
-- rattrapé par le contrôle avis (blocage sur le RFR) : ce défaut n'est jamais pire
-- que l'état antérieur. Données de test pré-lancement.
update public.dossiers
set caracteristiques_techniques_json = jsonb_set(
  caracteristiques_techniques_json,
  '{beneficiaire,precarite}',
  '"intermediaire"'::jsonb,
  false
)
where caracteristiques_techniques_json #>> '{beneficiaire,precarite}' = 'classique';

notify pgrst, 'reload schema';
