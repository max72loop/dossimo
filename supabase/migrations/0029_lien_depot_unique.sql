-- Un dossier ne doit exposer qu'un seul lien bénéficiaire actif.
-- Les doublons historiques sont révoqués en conservant le plus récent.
update public.liens_depot
set revoque_at = now()
where revoque_at is null and expire_at <= now();

with classes as (
  select id,
         row_number() over (partition by dossier_id order by created_at desc, id desc) as rang
  from public.liens_depot
  where revoque_at is null
)
update public.liens_depot l
set revoque_at = now()
from classes c
where l.id = c.id and c.rang > 1;

create unique index if not exists liens_depot_un_actif_par_dossier_idx
  on public.liens_depot (dossier_id)
  where revoque_at is null;

comment on index public.liens_depot_un_actif_par_dossier_idx is
  'Garantit un seul lien de dépôt bénéficiaire actif par dossier.';
