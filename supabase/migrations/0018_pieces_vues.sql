-- « Qu'est-ce qui a bougé depuis hier ? »
--
-- Le bénéficiaire dépose ses pièces par son lien, l'avis d'imposition est lu, le
-- contrôle peut basculer le dossier en refus certain — et personne ne le dit à
-- l'artisan. Il ne le découvre qu'en rouvrant le dossier, par hasard. On avait
-- construit une boîte aux lettres dont le facteur ne sonne pas.
--
-- Faute d'e-mail transactionnel (Resend n'est pas branché sur Dossimo), le signal
-- est porté par l'espace lui-même : la liste des dossiers montre ce qui est arrivé
-- depuis le dernier passage de l'artisan sur le dossier. Cette colonne est cette
-- mémoire — rien de plus qu'un « vu le ».
--
-- null = jamais ouvert depuis que les pièces existent : toute pièce du bénéficiaire
-- y est donc nouvelle, ce qui est le comportement voulu.

alter table public.dossiers
  add column if not exists pieces_vues_at timestamptz;

comment on column public.dossiers.pieces_vues_at is
  'Dernier passage de l''artisan sur le dossier. Une pièce du bénéficiaire déposée après cette date est « nouvelle » dans la liste.';
