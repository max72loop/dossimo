-- Pièces du BÉNÉFICIAIRE : l'enum type_piece ne connaissait que les documents
-- produits par l'artisan ('devis', 'facture', 'autre').
--
-- Or la moitié d'un dossier MaPrimeRénov' ne vient pas de l'artisan mais de son
-- client : identité, avis d'imposition, titre de propriété, RIB. La checklist les
-- réclame déjà (`pieces-cee-isolation.ts`) sans qu'aucune ne puisse être déposée.
--
-- Les identifiants reprennent EXACTEMENT ceux de la checklist (`PieceRequise.id`) :
-- c'est cette clé commune qui permet enfin de dire « la pièce `avis_imposition` est
-- déposée » et de cocher la liste toute seule.
--
-- ADD VALUE IF NOT EXISTS : idempotent, et ne peut pas être UTILISÉ dans la même
-- transaction que son ajout — d'où cette migration séparée, qui ne fait qu'ajouter.
-- Les tables qui s'en servent arrivent en 0017.

alter type type_piece add value if not exists 'avis_imposition';
alter type type_piece add value if not exists 'piece_identite';
alter type type_piece add value if not exists 'titre_propriete';
alter type type_piece add value if not exists 'rib';
alter type type_piece add value if not exists 'attestation_bailleur';
alter type type_piece add value if not exists 'photo_avant';
alter type type_piece add value if not exists 'photo_apres';
