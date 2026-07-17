-- Seed du 5e geste : chauffe-eau solaire individuel (CESI, BAR-TH-101).
--
-- FICHE : BAR-TH-101, PAS BAR-TH-143. Le 143 est le systeme solaire combine
-- (chauffage + ECS), avec des criteres tout autres (productivite >= 600 W/m²,
-- capteurs >= 8 m², ballon > 400 L) ; le 168 est le dispositif solaire sur
-- appoint separe. Seul le CESI est couvert.
--
-- SEUIL TECHNIQUE : l'efficacite energetique ECS depend du COUPLE (energie
-- d'appoint, profil de soutirage) — 36/37/38/60 % en appoint electrique a effet
-- Joule, 95/100/110/120 % sinon. Une matrice ne rentre pas dans une clef
-- scalaire : elle vit dans le code (SOLAIRE_EFFICACITE_ECS_MIN_DEFAUT), et
-- `efficacite_ecs_min` reste disponible ici pour forcer un seuil unique si un
-- arrete l'impose. Le CESI ne se qualifie PAS par une productivite de capteurs.
--
-- PRIME CEE : volontairement ABSENTE. La valorisation CEE du BAR-TH-101 se
-- calcule en kWh cumac selon la zone climatique (H1 18 500 / H2 21 000 /
-- H3 24 200), puis au prix du kWh cumac de l'oblige — ce n'est pas un forfait en
-- euros par profil de revenus. Sans barème, `estimerPrime` renvoie null et
-- l'artisan voit « — » : on prefere ne rien afficher qu'un montant invente.
--
-- PRIME MPR : le barème Anah 2026 a QUATRE profils (bleu 4 000 / jaune 3 000 /
-- violet 2 000 / rose NON ELIGIBLE, plafond de depense 7 000 €). Le modele n'en
-- porte que trois, et son `classique` confond violet et rose. On ne seede donc
-- que les deux profils representables sans ambiguite : un menage « classique »
-- n'a pas d'estimation (null) plutot qu'un montant faux pour moitie des cas.
-- Dette a traiter : porter les 4 profils MPR, cf. CLAUDE.md §13.

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis detaille signe par le beneficiaire. Il fait foi de la date d'engagement de l'operation.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Preuve de realisation : elle porte les mentions exigees par la fiche et reste coherente avec le devis.","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Decision de qualification valide a la date du devis, domaine Chauffage et/ou eau chaude solaire (QualiSol, Qualibat 5131/5132/5143/5241).","obligatoire":true},
    {"id":"certification_capteurs","label":"Certification des capteurs","description":"Certificat CSTBat ou Solar Keymark des capteurs, ou pieces d'equivalence etablies par un organisme accredite.","obligatoire":true},
    {"id":"fiche_technique","label":"Documentation constructeur","description":"Fiche produit : surface hors-tout, efficacite energetique ECS par profil, capacite et classe du ballon.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après","description":"Preuves visuelles de l'ancienne production d'eau chaude et de l'installation.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  -- Mentions litterales de la preuve de realisation du BAR-TH-101. La classe
  -- d'efficacite tombe d'elle-meme au-dela de 500 L (valeur absente du dossier
  -- -> mention non interpolee), ce qui est bien ce que veut la fiche.
  select $json$[
    "Fiche CEE : {fiche}",
    "Mise en place d'un chauffe-eau solaire individuel, appoint : {appoint}",
    "Nature du fluide circulant dans les capteurs : {fluide}",
    "Surface hors-tout totale des capteurs : {surface} m²",
    "Efficacite energetique pour le chauffage de l'eau (profil {soutirage}) : {efficacite} %",
    "Nombre de ballons d'eau chaude solaires installes : {ballons}",
    "Capacite de stockage de chaque ballon : {volume} L",
    "Classe d'efficacite energetique du ballon : {classe}",
    "Marque et reference du chauffe-eau solaire",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select t.dispositif::dispositif, 'solaire_thermique', t.cond::jsonb, pieces.liste, mentions.liste, t.vf, 1, true
from pieces, mentions, (values
  ('cee',          '{"tva_taux":0.055,"anciennete_min_ans":2,"surface_capteurs_min":2}', 'BAR-TH-101 vA78-3 (a compter du 01/01/2026)'),
  ('maprimerenov', '{"tva_taux":0.055,"anciennete_min_ans":15,"surface_capteurs_min":2,"prime":{"forfait":{"grande_precarite":4000,"precaire":3000},"plafond":7000}}', 'MaPrimeRenov par geste 2026 (chauffe-eau solaire individuel)')
) as t(dispositif, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;
