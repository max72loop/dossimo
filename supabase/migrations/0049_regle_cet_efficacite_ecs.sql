-- BAR-TH-148 : le critère d'éligibilité n'est plus le COP.
--
-- La fiche vA78-4, en vigueur depuis le 01/01/2026, ne mentionne plus une seule
-- fois le coefficient de performance. Le cadre A de l'attestation sur l'honneur
-- (fichier « Partie A à compter du 01-07-2026 ») demande :
--
--   *Efficacité énergétique pour le chauffage de l'eau, pour le profil de
--    soutirage déclaré (en %) : >= 95 % (M), 100 % (L), 110 % (XL).
--
-- Les règles seedées en `0010` exigeaient la mention du COP sur le devis et la
-- fiche technique. Résultat : un devis conforme pouvait être signalé, et un
-- appareil sous le plancher d'efficacité passait sans alerte.
-- Revue du 2026-07-25, cf. CHANGELOG-cerfa.md.
--
-- Version 2 INSÉRÉE, version 1 désactivée : `fetchRegleActive` prend la version
-- active la plus élevée. On ne réécrit pas la ligne d'origine — l'historique des
-- règles opposées à un dossier déjà contrôlé doit rester lisible.

with pieces as (
  select $json$[
    {"id":"devis_signe","label":"Devis signé et daté (entreprise RGE)","description":"Devis detaille signe par le beneficiaire : marque, reference, efficacite energetique ECS, profil de soutirage, volume.","obligatoire":true},
    {"id":"facture","label":"Facture","description":"Facture coherente avec le devis (memes caracteristiques techniques).","obligatoire":true},
    {"id":"qualification_rge","label":"Justificatif de qualification RGE","description":"Certificat RGE valide a la date du devis, couvrant le chauffe-eau thermodynamique.","obligatoire":true},
    {"id":"fiche_technique","label":"Documentation constructeur","description":"Fiche technique : efficacite energetique pour le chauffage de l'eau (reglement UE 814/2013), profil de soutirage, volume du ballon.","obligatoire":true},
    {"id":"photos","label":"Photographies avant / après","description":"Preuves visuelles de l'ancien systeme et de l'installation.","obligatoire":true}
  ]$json$::jsonb as liste
),
mentions as (
  select $json$[
    "Type et modele du chauffe-eau thermodynamique (marque et reference)",
    "Efficacite energetique pour le chauffage de l'eau, au profil de soutirage declare (%)",
    "Profil de soutirage declare (M, L ou XL)",
    "Volume du ballon (litres)",
    "Mention de la qualification RGE (n° et domaine)"
  ]$json$::jsonb as liste
)
insert into public.regles_metier
  (dispositif, type_travaux, condition_json, pieces_requises_json, points_vigilance_json, version_formulaire, version, actif)
select t.dispositif::dispositif, 'cet', t.cond::jsonb, pieces.liste, mentions.liste, t.vf, 2, true
from pieces, mentions, (values
  -- `cop_min` retiré : le moteur ne le lit plus. Le plancher d'efficacité reste
  -- en repli côté code (95/100/110 selon le profil), surchargeable ici par
  -- `efficacite_ecs_min` si un arrete le deplace.
  ('cee',          '{"tva_taux":0.055,"anciennete_min_ans":2,"prime":{"forfait":{"grande_precarite":1200,"precaire":900,"intermediaire":600,"superieur":600}}}', 'BAR-TH-148 vA78-4 (a compter du 01/01/2026)'),
  ('maprimerenov', '{"tva_taux":0.055,"anciennete_min_ans":15,"prime":{"forfait":{"grande_precarite":1200,"precaire":800,"intermediaire":400}}}', 'MaPrimeRenov par geste 2026 (CET)')
) as t(dispositif, cond, vf)
on conflict (dispositif, type_travaux, version) do nothing;

-- Désactivation de la version 1 seulement si la 2 a bien été insérée : sans ce
-- garde-fou, un rejeu partiel laisserait le geste CET sans aucune règle active.
update public.regles_metier r1
set actif = false
where r1.type_travaux = 'cet'
  and r1.version = 1
  and exists (
    select 1
    from public.regles_metier r2
    where r2.type_travaux = 'cet'
      and r2.dispositif = r1.dispositif
      and r2.version = 2
      and r2.actif
  );
