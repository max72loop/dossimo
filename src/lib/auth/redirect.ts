/**
 * Destination sûre après authentification.
 *
 * On n'honore `next` que s'il pointe vers l'espace dossiers : cela suffit aux
 * parcours réels (reprise d'un brouillon d'essai, dépôt d'un devis) tout en
 * fermant la porte à un open-redirect (`//evil.com`, `https://…`). Toute valeur
 * hors périmètre retombe sur `/dossiers`.
 *
 * Partagé entre les Server Components (redirection d'un utilisateur déjà
 * connecté) et les formulaires client (redirection après login/inscription) :
 * une seule règle, impossible à désynchroniser.
 */
export function destinationApresAuth(next?: string): string {
  return next && next.startsWith("/dossiers") && !next.startsWith("//")
    ? next
    : "/dossiers";
}
