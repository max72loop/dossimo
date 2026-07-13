-- Revue humaine des pièces déposées par le bénéficiaire.
-- Une pièce n'est jamais considérée acceptable automatiquement : l'artisan garde
-- la décision finale et un rejet peut être expliqué au bénéficiaire à la relance.
alter table public.pieces_justificatives
  add column if not exists validation_status text
    check (validation_status in ('submitted', 'approved', 'rejected')),
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at timestamptz;

update public.pieces_justificatives
set validation_status = 'submitted'
where deposant = 'beneficiaire' and validation_status is null;

create index if not exists pieces_beneficiaire_validation_idx
  on public.pieces_justificatives (dossier_id, deposant, validation_status);
