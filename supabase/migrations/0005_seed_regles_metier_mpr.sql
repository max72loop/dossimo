-- Seed du dispositif MaPrimeRénov' dans le moteur de règles éditable (§7/§9.4).
--
-- Gestes d'isolation éligibles au parcours par geste en 2026 : combles perdus,
-- rampants de toiture, plancher bas. L'isolation des MURS n'est PLUS éligible à
-- MaPrimeRénov' par geste depuis le 01/01/2026 → volontairement absente.
--
-- Différences clés vs CEE portées par la donnée : logement achevé depuis > 15 ans
-- (au lieu de 2), pièces du particulier (identité, avis d'imposition, titre de
-- propriété, RIB — ajoutées par le code selon le dossier), pas de « cadre de
-- contribution » ni d'attestation sur l'honneur CEE.

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis détaillé signé par le bénéficiaire, établi par une entreprise RGE, décrivant le geste et ses caractéristiques.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Facture des travaux, cohérente avec le devis (mêmes caractéristiques techniques).","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE de l'entreprise, valide et couvrant le geste réalisé.","obligatoire":true},
    {"id":"fiche_technique","label":"Fiche technique de l'isolant","description":"Fiche produit mentionnant la marque, la référence, la résistance thermique et la certification ACERMI.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après travaux","description":"Preuves visuelles de l'état initial et des travaux réalisés.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  select $json$[
    "Descriptif détaillé du geste et des travaux réalisés",
    "Marque et référence de l'isolant posé",
    "Surface isolée : {surface} m²",
    "Résistance thermique R = {r} m²·K/W",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select
  'maprimerenov'::dispositif,
  t.type,
  t.cond::jsonb,
  pieces.liste,
  mentions.liste,
  'MaPrimeRénov'' 2026 (parcours par geste)',
  1,
  true
from pieces, mentions, (values
  ('combles_perdus',  '{"r_min":7,"tva_taux":0.055,"anciennete_min_ans":15}'),
  ('rampants_toiture','{"r_min":6,"tva_taux":0.055,"anciennete_min_ans":15}'),
  ('plancher_bas',    '{"r_min":3,"tva_taux":0.055,"anciennete_min_ans":15}')
) as t(type, cond)
on conflict (dispositif, type_travaux, version) do nothing;
