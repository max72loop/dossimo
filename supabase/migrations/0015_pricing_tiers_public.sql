-- Les paliers de prix deviennent lisibles par les visiteurs anonymes.
--
-- La policy de la migration 0012 réservait `pricing_tiers` aux utilisateurs
-- connectés (`for select to authenticated`). Or la landing et les CGV — servies à
-- des visiteurs ANONYMES — doivent annoncer la grille tarifaire. Elles s'appuyaient
-- donc sur une grille codée en dur ailleurs, qui a divergé de la table : la vitrine
-- promettait « de 49 € à 149 € » quand le checkout facturait jusqu'à 249 €.
--
-- Un tarif public n'est pas une donnée à protéger : il est affiché sur la page
-- d'accueil. En l'ouvrant à `anon`, la vitrine lit la MÊME source que le checkout,
-- et l'écart entre le prix promis et le prix facturé devient structurellement
-- impossible (CLAUDE.md §10 : la grille vit en base, jamais en dur dans le code).
--
-- Seuls les paliers ACTIFS sont exposés ; l'écriture reste interdite (aucune policy
-- insert/update/delete : seul le service-role administre la grille).
drop policy if exists "paliers lisibles" on public.pricing_tiers;

create policy "paliers lisibles" on public.pricing_tiers
  for select
  to anon, authenticated
  using (active = true);

comment on table public.pricing_tiers is
  'Grille tarifaire à paliers, indexée sur l''aide estimée. Référentiel PUBLIC en lecture (affiché sur la landing et les CGV) ; écriture réservée au service-role.';
