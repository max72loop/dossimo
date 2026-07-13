-- Références documentaires importées le 13 juillet 2026.
-- Les modèles restent volontairement en statut « placeholder » tant qu'une revue
-- métier n'a pas été enregistrée via /admin/devis.
update public.quote_gestures
set cee_fiche_reference = 'BAR-TH-125'
where slug = 'vmc-double-flux';

update public.quote_templates t
set source_url = sources.source_url,
    notes = coalesce(t.notes, 'Fiche officielle archivée dans docs/sources-reglementaires/cee ; revue métier requise avant publication.')
from (
  select slug, source_url
  from (values
    ('pac-air-eau', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-TH-171%20vA78.4%20%C3%A0%20compter%20du%2001-01-2026_1.pdf'),
    ('combles-perdus', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-EN-101%20vA64-6%20%C3%A0%20compter%20du%2001-01-2025_1.pdf'),
    ('murs-exterieur', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-EN-102%20vA65-4%20%C3%A0%20compter%20du%2001-01-2025_1.pdf'),
    ('poele-granules', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-TH-112%20vA46-3%20%C3%A0%20compter%20du%2001-10-2022_1.pdf'),
    ('chauffe-eau-thermodynamique', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-TH-148%20vA78-4%20%C3%A0%20compter%20du%2001-01-2026.pdf'),
    ('vmc-double-flux', 'https://www.ecologie.gouv.fr/sites/default/files/documents/BAR-TH-125%20vA54-5%20%C3%A0%20compter%20du%2001-01-2024_1.pdf')
  ) as imported(slug, source_url)
) as sources
join public.quote_gestures g on g.slug = sources.slug
where t.gesture_id = g.id
  and t.version = 1
  and t.source_url is null;
