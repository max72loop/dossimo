-- Vérification des mentions obligatoires sur les pièces réelles (devis / facture).
--
-- Renumérotée de 0014 à 0035 (16/07/2026) : elle partageait le préfixe `0014`
-- avec `0014_facturation.sql`, or Supabase suit les migrations par ce numéro
-- (clé unique dans schema_migrations) — le doublon bloquait tout `db push`
-- rejouant l'historique. Contenu strictement idempotent, l'ordre n'importe pas.
--
-- Jusqu'ici, l'extraction VLM ne relevait que des VALEURS (surface, R, montants…),
-- comparées à la saisie. Elle ne vérifiait AUCUNE des mentions obligatoires que la
-- fiche CEE impose de porter sur le devis et la facture — alors que leur absence est
-- un motif de refus à part entière, indépendant de la justesse des chiffres.
--
-- `mentions_json` stocke le résultat de la seconde passe du VLM : pour chaque mention
-- exigée (résolue depuis `regles_metier.points_vigilance_json`, interpolée au dossier),
-- son statut sur le document, le verbatim relevé et la confiance de lecture.
--
-- Forme : [{ "mention": "...", "statut": "presente|absente|divergente",
--            "verbatim": "..."|null, "confiance": 0.0-1.0 }]
--
-- Nullable : les pièces déjà téléversées n'ont pas été passées au contrôle des
-- mentions, et une extraction en échec n'en produit pas. `null` = « non vérifié »,
-- distinct de « aucune mention manquante » (tableau vide).
alter table public.pieces_justificatives
  add column if not exists mentions_json jsonb;

comment on column public.pieces_justificatives.mentions_json is
  'Mentions obligatoires relevées sur la pièce par le VLM : statut, verbatim, confiance. null = non vérifié.';
