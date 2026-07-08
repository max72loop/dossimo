-- Seed du moteur de règles éditable (CLAUDE.md §7/§9.4).
--
-- Objectif : sortir du code les PARAMÈTRES par couple (dispositif, type_travaux)
-- — seuils techniques, taux, pièces requises, version de fiche — vers la table
-- `regles_metier`, éditable et versionnée. Le code garde le MOTEUR déterministe
-- (comparaisons de dates, arithmétique) et lit ces paramètres ; il retombe sur
-- ses valeurs en dur si aucune règle active n'est trouvée (aucune régression).
--
-- Les 4 types correspondent aux fiches BAR-EN de l'isolation. Les valeurs de R
-- sont indicatives et surtout DÉSORMAIS ÉDITABLES ici sans redéploiement.

with pieces as (
  select $json$[
    {"id":"cadre_contribution","label":"Cadre contribution / preuve du rôle actif et incitatif","description":"Document prouvant que l'offre CEE (le « coup de pouce ») a été proposée AVANT la signature du devis. Sans antériorité, le dossier est refusé.","obligatoire":true},
    {"id":"devis_signe","label":"Devis signé et daté","description":"Signé par le bénéficiaire, portant toutes les mentions obligatoires CEE et daté avant le début des travaux.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Reprenant à l'identique les mentions techniques (marque, référence, surface, R) et cohérente avec le devis.","obligatoire":true},
    {"id":"attestation_honneur","label":"Attestation sur l'honneur (AH)","description":"Signée par le bénéficiaire ET le professionnel, datée après la fin des travaux.","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE valide à la date de signature du devis, couvrant le domaine des travaux réalisés.","obligatoire":true},
    {"id":"fiche_technique","label":"Fiche technique de l'isolant","description":"Fiche produit mentionnant la marque, la référence, la résistance thermique et la certification ACERMI.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après travaux","description":"Preuves visuelles de l'état initial et des travaux réalisés (souvent exigées au contrôle).","obligatoire":true}
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, version_formulaire, version, actif)
select
  'cee'::dispositif,
  t.type,
  t.cond::jsonb,
  pieces.liste,
  t.vf,
  1,
  true
from pieces, (values
  ('combles_perdus',  '{"r_min":7,"tva_taux":0.055,"anciennete_min_ans":2}', 'BAR-EN-101 vA64.6'),
  ('rampants_toiture','{"r_min":6,"tva_taux":0.055,"anciennete_min_ans":2}', 'BAR-EN-101 vA64.6'),
  ('murs',            '{"r_min":3.7,"tva_taux":0.055,"anciennete_min_ans":2}', 'BAR-EN-102'),
  ('plancher_bas',    '{"r_min":3,"tva_taux":0.055,"anciennete_min_ans":2}', 'BAR-EN-103')
) as t(type, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;
