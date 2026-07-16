-- Rend la révocation d'un lien de dépôt RÉELLE.
--
-- LA FAILLE (audit du 2026-07-16, gravité élevée)
-- Le token du lien de dépôt était déterministe :
--     HMAC-SHA256(secret, 'dossimo:depot:v1:' || dossier_id)
-- Il n'existait donc qu'UN SEUL token possible par dossier, pour toujours.
--
-- Scénario d'exploitation :
--   1. L'artisan envoie le lien par WhatsApp. L'URL fuite (téléphone perdu,
--      capture d'écran, groupe, historique).
--   2. L'artisan révoque : `revoque_at` est posé. L'URL fuitée est morte. OK.
--   3. L'artisan regénère un lien pour son client : le token étant déterministe,
--      il est recalculé À L'IDENTIQUE, et l'upsert (onConflict: token_hash)
--      remet `revoque_at = null` sur la ligne révoquée.
--   4. L'URL fuitée REDEVIENT VALIDE.
--
-- Cette URL donne accès à un avis d'imposition, un RIB et une pièce d'identité.
-- Le bouton « révoquer » offert à l'artisan lui donnait une fausse assurance, ce
-- qui est pire que son absence.
--
-- LE CORRECTIF : un nonce par lien
-- Le token devient :
--     HMAC-SHA256(secret, 'dossimo:depot:v2:' || dossier_id || ':' || nonce)
-- où `nonce` est 32 octets aléatoires, stockés ici, propres à CE lien.
--
-- Le nonce est réutilisé tant que le lien est actif (l'URL reste donc stable
-- entre l'écran et les relances : c'est la propriété que le design déterministe
-- cherchait, et elle est préservée), mais un lien révoqué ou expiré n'est jamais
-- réactivé : le suivant reçoit un nonce NEUF, donc un token différent, donc une
-- URL différente. L'URL fuitée reste morte pour toujours.
--
-- POURQUOI PAS UN TOKEN PUREMENT ALÉATOIRE
-- Parce que seul le HASH du token est stocké (et c'est bien). Sans dérivation, le
-- serveur ne pourrait plus réafficher à l'artisan le lien qu'il a déjà envoyé :
-- `retrouverLienActif` deviendrait impossible. Le nonce garde la dérivation, donc
-- la réaffichabilité, tout en rendant chaque génération unique.
--
-- COMPATIBILITÉ AVEC LES LIENS DÉJÀ EN CIRCULATION
-- `token_nonce` est nullable : les lignes existantes (tokens v1) le laissent à
-- NULL. Elles continuent de RÉSOUDRE normalement, car la résolution se fait par
-- hash et ne dépend pas de la dérivation : aucun bénéficiaire ne voit son lien
-- cesser de marcher au déploiement.
--
-- Elles ne sont en revanche plus RÉAFFICHABLES à l'artisan : leur token était
-- dérivé de l'ancien secret et n'est plus recalculable, donc `retrouverLienActif`
-- renvoie null pour un nonce NULL. Deux issues pour un lien v1 :
--   - l'artisan réémet (bouton, ou préparation d'une relance) : le lien bascule
--     en v2, avec une URL NEUVE, et l'ancienne est révoquée dans la foulée. Le
--     bénéficiaire reçoit la nouvelle URL dans le message. C'est le cas courant.
--   - personne ne réémet : le lien v1 expire de lui-même sous 60 jours.
-- Dans les deux cas les tokens v1, dérivés d'un secret qui était la clé
-- service-role, disparaissent de la circulation. C'est voulu. Voir
-- src/lib/depot/lien.ts.
--
-- PRÉREQUIS DE DÉPLOIEMENT : `DEPOT_LINK_SECRET` (32 caractères minimum) doit
-- être défini AVANT de déployer le code qui va avec. Le repli sur
-- SUPABASE_SERVICE_ROLE_KEY a été supprimé : sans cette variable, l'émission
-- d'un lien échoue franchement au lieu de marcher en mode dégradé.

alter table public.liens_depot
  add column if not exists token_nonce text;

comment on column public.liens_depot.token_nonce is
  'Aléa (32 octets, base64url) entrant dans la dérivation du token v2. Neuf à '
  'chaque nouveau lien : c''est lui qui rend la révocation définitive. '
  'NULL = lien v1 historique (déterministe), résoluble mais non réaffichable.';

-- Le nonce n'est PAS un secret utile seul (il faut aussi le secret serveur), mais
-- il ne sort jamais de la base : aucune policy ne l'expose, la table est en
-- service-role. Rien à changer côté RLS.
