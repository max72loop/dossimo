-- Seed du 4e geste : appareil de chauffage au bois (BAR-TH-112).
--
-- Barème en FORFAIT (montant fixe par profil de revenus). Seuil de rendement
-- par défaut côté code selon le combustible (granulés 80 %, bûches 75 %),
-- surchargeable par rendement_min : on ne le fige pas ici. Forfaits
-- MaPrimeRénov' par geste 2026 (poêle à granulés) ; forfaits CEE INDICATIFS.

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis detaille signe par le beneficiaire : marque, reference, rendement, combustible.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Facture coherente avec le devis (memes caracteristiques techniques).","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE valide a la date du devis, couvrant l'appareil de chauffage au bois.","obligatoire":true},
    {"id":"fiche_technique","label":"Documentation constructeur / label","description":"Fiche technique : rendement, emissions, label Flamme Verte.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après","description":"Preuves visuelles de l'ancien systeme et de l'installation.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  select $json$[
    "Type et modele de l'appareil (marque et reference)",
    "Combustible et rendement energetique (label Flamme Verte)",
    "Emissions de CO et de particules",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select t.dispositif::dispositif, 'bois', t.cond::jsonb, pieces.liste, mentions.liste, t.vf, 1, true
from pieces, mentions, (values
  ('cee',          '{"tva_taux":0.055,"anciennete_min_ans":2,"prime":{"forfait":{"grande_precarite":900,"precaire":700,"classique":500}}}', 'BAR-TH-112 (a compter du 01/01/2026)'),
  ('maprimerenov', '{"tva_taux":0.055,"anciennete_min_ans":15,"prime":{"forfait":{"grande_precarite":2500,"precaire":2000,"classique":1000}}}', 'MaPrimeRenov par geste 2026 (chauffage bois)')
) as t(dispositif, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;
