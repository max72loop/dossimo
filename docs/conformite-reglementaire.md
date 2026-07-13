# Processus de conformité réglementaire

## Règle de publication

Un modèle documentaire ou une règle de calcul ne passe en production qu'après :

1. comparaison avec la source réglementaire primaire (Légifrance, ministère,
   Anah ou ATEE selon le dispositif) ;
2. archivage de la source et de sa date de consultation ;
3. revue à quatre yeux par une personne compétente métier ;
4. test automatisé des règles et rendu PDF inspecté visuellement ;
5. inscription dans [`CHANGELOG-cerfa.md`](../CHANGELOG-cerfa.md).

## Revue récurrente

Le premier jour ouvré de chaque mois, le responsable conformité vérifie :

- les fiches d'opérations standardisées CEE couvertes ;
- les modèles d'attestation et leurs dates d'effet ;
- les barèmes, plafonds et parcours MaPrimeRénov' ;
- les changements d'annuaires RGE/SIRENE et des fournisseurs d'API.

Toute divergence bloque la génération concernée jusqu'à validation. Les contrôles
doivent privilégier les sources primaires et ne jamais conclure à une conformité
sur la seule base d'une extraction IA.

## Déploiement des migrations

Le dépôt contient deux migrations au préfixe `0014`. Avant le prochain `supabase db
push`, comparer l'historique de production (`supabase migration list`) avec le dépôt.
Ne pas renommer une migration déjà appliquée : créer une migration corrective ou
réconcilier l'historique avec la personne responsable de la base. Une fois vérifié,
donner un identifiant unique à la migration locale non appliquée.
