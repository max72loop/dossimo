# SEO Dossimo — fichier d'état de l'agent

> Source de vérité opérationnelle. Chaque passage lit ce fichier avant d'agir et y
> écrit après. Contrat complet : `seo/AGENTS.md`.

## Relevés GSC (le plus récent en haut)

_Aucun relevé pour l'instant — le pont `gsc_read.py` attend sa clé de compte de
service Google. Premier relevé attendu au premier lundi d'activation._

## Décisions prises (le plus récent en haut)

_Aucune décision pour l'instant._

## Livrables du jeudi

_Aucun pour l'instant._

## Gel SEO en cours (6 semaines)

| Page | Gelée le | Libre le | Motif |
|---|---|---|---|
| /actualites-maprimerenov-cee | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /deleguer-montage-dossier-cee | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /alternative-mandataire-maprimerenov | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /sous-traiter-dossier-maprimerenov | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /temps-montage-dossier-cee | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /cout-dossier-refuse | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |
| /checklist-avant-depot | 2026-08-21 | 2026-10-02 | publiée le jour de l'installation |

## Hypothèses en attente de vérification

_Aucune pour l'instant._

## Parking « particulier » (attente d'arbitrage de Max)

_Aucune idée pour l'instant. Rappel : rien ne vise le particulier sans arbitrage._

## Notes hors méthode

- 2026-08-21 : installation. 43 URLs au sitemap (40 utiles hors pages légales).
  Les 7 pages du 21/08 entrent gelées (tableau ci-dessus).
- 2026-09-07 : intervention de Max (hors cadence de l'agent) : maillage du
  cluster `/refus` (footer, header, menu, bloc motif → guide de prévention),
  maillage des guides par famille au lieu de « tous vers tous », auteur incarné
  (Max Landry) sur `/a-propos` et dans les guides (bloc « Relecture » +
  JSON-LD `Person`). **Le gel est respecté** : `src/lib/seo/gel-seo.ts` fait
  garder aux 7 pages du tableau leur rendu SEO d'origine (auteur, maillage,
  JSON-LD) jusqu'au 2026-10-02 ; seuls header, footer et menu, communs à tout
  le site, changent aussi sur elles. À la libération du 02/10, supprimer
  `gel-seo.ts` et ses points d'appel (grep `estGeleSeo`) au premier passage.
