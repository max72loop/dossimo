-- Barème de prime INDICATIF, ajouté à condition_json des règles (§7/§9.4).
--
-- Valeurs €/m² par catégorie de revenus, volontairement INDICATIVES : les vrais
-- barèmes (Coup de pouce CEE, forfaits MaPrimeRénov' par geste et par profil)
-- changent souvent et doivent être ajustés dans l'admin (/admin/regles). Le code
-- ne fait que multiplier par la surface — il n'invente aucun montant officiel.
--
-- `||` sur jsonb ajoute la clé `prime` sans écraser r_min / tva_taux / anciennete.

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"classique":5,"precaire":8,"grande_precarite":10}}}'::jsonb
where dispositif = 'cee';

update public.regles_metier
set condition_json = condition_json
  || '{"prime":{"par_m2":{"classique":10,"precaire":20,"grande_precarite":25}}}'::jsonb
where dispositif = 'maprimerenov';
