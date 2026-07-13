-- Bibliothèque de formulations de devis. Le contenu métier est versionné en base.
create table public.quote_gestures (
  id uuid primary key default gen_random_uuid(), slug text not null unique, label text not null,
  category text not null, mpr_eligible boolean not null default false, cee_eligible boolean not null default true,
  cee_fiche_reference text, active boolean not null default true, valid_from date not null default current_date,
  valid_until date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.quote_gesture_fields (
  id uuid primary key default gen_random_uuid(), gesture_id uuid not null references public.quote_gestures(id) on delete cascade,
  key text not null, label text not null, type text not null check (type in ('text','number','boolean')),
  unit text, required boolean not null default false, min_value numeric, max_value numeric, help_text text,
  position integer not null default 0, created_at timestamptz not null default now(), unique(gesture_id, key)
);
create table public.quote_templates (
  id uuid primary key default gen_random_uuid(), gesture_id uuid not null references public.quote_gestures(id),
  version integer not null, lines jsonb not null, mandatory_mentions jsonb not null default '[]'::jsonb,
  valid_from date not null default current_date, valid_until date, active boolean not null default true,
  placeholder boolean not null default true, created_at timestamptz not null default now(), unique(gesture_id, version)
);
create table public.generated_quotes (
  id uuid primary key default gen_random_uuid(), artisan_id uuid not null references public.artisans(id),
  gesture_id uuid not null references public.quote_gestures(id), dossier_id uuid references public.dossiers(id) on delete set null,
  template_version integer not null, field_values jsonb not null, rendered_lines jsonb not null, created_at timestamptz not null default now()
);
alter table public.quote_gestures enable row level security;
alter table public.quote_gesture_fields enable row level security;
alter table public.quote_templates enable row level security;
alter table public.generated_quotes enable row level security;
create policy "catalogue devis lisible" on public.quote_gestures for select to authenticated using (active);
create policy "champs devis lisibles" on public.quote_gesture_fields for select to authenticated using (true);
create policy "templates devis lisibles" on public.quote_templates for select to authenticated using (active);
create policy "artisan gere ses devis generes" on public.generated_quotes for all to authenticated
  using (exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid()));

-- Données de démonstration : aucune ne doit être publiée sans revue métier documentée.
insert into public.quote_gestures (slug,label,category,mpr_eligible,cee_eligible,cee_fiche_reference) values
('pac-air-eau','Pompe à chaleur air/eau','chauffage',true,true,'BAR-TH-171'),
('combles-perdus','Isolation de combles perdus','isolation',true,true,'BAR-EN-101'),
('murs-exterieur','Isolation des murs par l''extérieur','isolation',false,true,'BAR-EN-102'),
('poele-granules','Poêle à granulés','chauffage',true,true,'BAR-TH-112'),
('chauffe-eau-thermodynamique','Chauffe-eau thermodynamique','chauffage',true,true,'BAR-TH-148'),
('vmc-double-flux','VMC double flux','ventilation',true,true,'À VALIDER')
on conflict (slug) do nothing;

insert into public.quote_gesture_fields (gesture_id,key,label,type,unit,required,min_value,help_text,position)
select id, 'marque', 'Marque', 'text', null, true, null, 'À relever sur la fiche fabricant.', 1 from public.quote_gestures on conflict do nothing;
insert into public.quote_gesture_fields (gesture_id,key,label,type,unit,required,min_value,help_text,position)
select id, 'reference', 'Référence produit', 'text', null, true, null, 'Référence exacte du produit posé.', 2 from public.quote_gestures on conflict do nothing;
insert into public.quote_gesture_fields (gesture_id,key,label,type,unit,required,min_value,help_text,position)
select id, 'performance', 'Performance déclarée', 'number', '%', true, null, 'Seuil à valider avant publication réglementaire.', 3 from public.quote_gestures on conflict do nothing;

insert into public.quote_templates (gesture_id,version,lines,mandatory_mentions)
select id, 1,
jsonb_build_array(
 jsonb_build_object('type','designation','template','[À VALIDER] Fourniture et pose : {{label}} {{marque}} référence {{reference}}.'),
 jsonb_build_object('type','performance','template','Performance déclarée : {{performance}} {{performance_unit}}.'),
 jsonb_build_object('cee','template','Référence CEE : {{cee_fiche_reference}}. Conditions et formulation à valider avec l''obligé retenu.'),
 jsonb_build_object('mention','template','Entreprise RGE : mentionner le numéro de qualification, son domaine et sa validité sur le devis.')
), jsonb_build_array('Désignation complète', 'Marque et référence', 'Performance technique', 'Qualification RGE', 'Référence de fiche CEE')
from public.quote_gestures where not exists (select 1 from public.quote_templates t where t.gesture_id = quote_gestures.id and t.version = 1);
