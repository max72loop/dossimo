-- Seed du premier geste hors isolation : pompe à chaleur air/eau (BAR-TH-171).
--
-- Barème en FORFAIT (montant fixe par profil de revenus), pas en €/m². Seuil
-- ETAS piloté par le régime de température côté code (basse ~126 %, moyenne/haute
-- ~111 %) ; on ne fige pas etas_min ici. Forfaits MaPrimeRénov' par geste 2026 ;
-- forfaits CEE INDICATIFS (varient selon l'obligé, l'ETAS et la zone).

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis detaille signe par le beneficiaire : marque, reference, ETAS, puissance, regulateur.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Facture cohérente avec le devis (memes caracteristiques techniques).","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE valide a la date du devis, couvrant l'installation de pompe a chaleur.","obligatoire":true},
    {"id":"note_dimensionnement","label":"Note de dimensionnement","description":"Note de dimensionnement de la PAC remise au beneficiaire (exigee par BAR-TH-171).","obligatoire":true},
    {"id":"fiche_technique","label":"Documentation constructeur","description":"Fiche technique : ETAS, puissance, classe du regulateur.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après","description":"Preuves visuelles de l'ancien systeme et de l'installation.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  select $json$[
    "Type et modele de la pompe a chaleur (marque et reference)",
    "Efficacite energetique saisonniere (ETAS) et regime de temperature",
    "Puissance thermique de l'appareil",
    "Classe du regulateur (IV a VIII) et note de dimensionnement",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select t.dispositif::dispositif, 'pac_air_eau', t.cond::jsonb, pieces.liste, mentions.liste, t.vf, 1, true
from pieces, mentions, (values
  ('cee',          '{"tva_taux":0.055,"anciennete_min_ans":2,"prime":{"forfait":{"grande_precarite":4500,"precaire":3500,"classique":2500}}}', 'BAR-TH-171 vA78.4 (a compter du 01/01/2026)'),
  ('maprimerenov', '{"tva_taux":0.055,"anciennete_min_ans":15,"prime":{"forfait":{"grande_precarite":5000,"precaire":4000,"classique":3000}}}', 'MaPrimeRenov par geste 2026 (PAC air/eau)')
) as t(dispositif, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;
