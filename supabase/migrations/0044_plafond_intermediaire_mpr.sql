-- Plafond « intermédiaire » (profil violet de l'Anah) dans le barème de ressources.
--
-- Pourquoi : le modèle interne à trois bandes (grande_precarite / precaire /
-- classique, calqué sur le CEE) range dans `classique` DEUX profils MaPrimeRénov'
-- que tout sépare : le VIOLET (intermédiaire, éligible aux gestes) et le ROSE
-- (supérieur, NON éligible au parcours par geste en 2026). Sans la borne haute du
-- violet, aucun contrôle ne peut voir qu'un ménage rose sera refusé : Dossimo
-- valide un dossier MPR voué au refus, exactement le motif qu'il prétend éviter
-- (CLAUDE.md §8, dette §13).
--
-- Le CEE, lui, ignore la distinction violet / rose : cette colonne ne le concerne
-- pas. Elle ne sert qu'au parcours MaPrimeRénov' par geste.
--
-- Additive : colonne nullable, puis backfill des lignes 2026. Un barème sans cette
-- valeur (autre année, zone non couverte) reste lisible ; le code retombe alors sur
-- « ne rien conclure » plutôt que d'inventer une inéligibilité.

alter table public.plafonds_ressources
  add column if not exists plafond_intermediaire int;

comment on column public.plafonds_ressources.plafond_intermediaire is
  'Plafond de RFR du profil « intermédiaire » (violet de l''Anah). Sa borne haute '
  'sépare le violet (éligible MPR par geste) du rose (supérieur, non éligible en '
  '2026). null = inconnu, ne pas conclure. Ne concerne que MaPrimeRénov''.';

-- Barème 2026 — RFR 2025. Source : guide Anah « Les aides financières en 2026 »
-- (édition février 2026, p. 8). Les valeurs grande_precarite / precaire déjà seedées
-- en 0017 sont inchangées ; on n'ajoute que la borne haute du violet.
update public.plafonds_ressources as p
set plafond_intermediaire = v.inter
from (values
  ('hors_idf', 1, 31185),
  ('hors_idf', 2, 45842),
  ('hors_idf', 3, 55196),
  ('hors_idf', 4, 64550),
  ('hors_idf', 5, 73907),
  ('hors_idf', 0,  9357), -- par personne supplémentaire au-delà de 5
  ('idf', 1, 40851),
  ('idf', 2, 60051),
  ('idf', 3, 71846),
  ('idf', 4, 84562),
  ('idf', 5, 96817),
  ('idf', 0, 12257)       -- par personne supplémentaire au-delà de 5
) as v(zone, personnes, inter)
where p.annee = 2026 and p.zone = v.zone and p.personnes = v.personnes;