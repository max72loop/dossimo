-- Seed du 3e geste : chauffe-eau thermodynamique (BAR-TH-148).
--
-- Barème en FORFAIT (montant fixe par profil de revenus). Seuil COP par défaut
-- 2,5 côté code (surchargeable par cop_min) : on ne fige pas cop_min ici.
-- Forfaits MaPrimeRénov' par geste 2026 (CET) ; forfaits CEE INDICATIFS.

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis detaille signe par le beneficiaire : marque, reference, COP, profil de soutirage, volume.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Facture coherente avec le devis (memes caracteristiques techniques).","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE valide a la date du devis, couvrant le chauffe-eau thermodynamique.","obligatoire":true},
    {"id":"fiche_technique","label":"Documentation constructeur","description":"Fiche technique : COP (EN 16147), profil de soutirage, volume du ballon.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après","description":"Preuves visuelles de l'ancien systeme et de l'installation.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  select $json$[
    "Type et modele du chauffe-eau thermodynamique (marque et reference)",
    "Coefficient de performance (COP) et profil de soutirage (EN 16147)",
    "Volume du ballon (litres)",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select t.dispositif::dispositif, 'cet', t.cond::jsonb, pieces.liste, mentions.liste, t.vf, 1, true
from pieces, mentions, (values
  ('cee',          '{"tva_taux":0.055,"anciennete_min_ans":2,"prime":{"forfait":{"grande_precarite":1200,"precaire":900,"classique":600}}}', 'BAR-TH-148 (a compter du 01/01/2026)'),
  ('maprimerenov', '{"tva_taux":0.055,"anciennete_min_ans":15,"prime":{"forfait":{"grande_precarite":1200,"precaire":800,"classique":400}}}', 'MaPrimeRenov par geste 2026 (CET)')
) as t(dispositif, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;
