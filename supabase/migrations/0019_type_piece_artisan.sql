-- Les pièces de l'ARTISAN que la checklist réclame sans qu'on puisse les déposer.
--
-- 0016 avait ouvert l'enum aux pièces du bénéficiaire. Restaient les siennes :
-- certificat RGE, fiche technique de l'isolant, cadre de contribution, attestation
-- sur l'honneur. Toutes marquées « obligatoire » dans la checklist, aucune
-- téléversable — la liste restait une colonne de cases inertes, et le « pack complet
-- et vérifié » n'était vérifié que sur le devis et la facture.
--
-- Les identifiants reprennent ceux de la checklist (`PieceRequise.id`), sauf pour le
-- devis (`devis_signe` -> 'devis', déjà là) et les photos (`photos` -> 'photo_avant'
-- + 'photo_apres', ajoutés en 0016) : le liant est explicite dans `piece/checklist.ts`.
--
-- ADD VALUE IF NOT EXISTS : idempotent, et ne peut pas être utilisé dans la même
-- transaction que son ajout — cette migration ne fait donc qu'ajouter.

alter type type_piece add value if not exists 'qualification_rge';
alter type type_piece add value if not exists 'fiche_technique';
alter type type_piece add value if not exists 'cadre_contribution';
alter type type_piece add value if not exists 'attestation_honneur';
