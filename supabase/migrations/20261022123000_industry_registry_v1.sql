-- RINADS Industry Registry v1
-- Canonical industry classification for onboarding, Industry Packs and future NIC/ISIC/NAICS mappings.

create table if not exists public.industry_families (
  id text primary key,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.industries (
  id text primary key,
  family_id text not null references public.industry_families(id),
  label text not null,
  template_key text not null default 'generic-retail'
    check (template_key in ('generic-retail', 'ambady-nursery', 'salon-os')),
  source text not null default 'rinads' check (source in ('uploaded', 'rinads', 'system')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists industries_family_idx on public.industries(family_id, sort_order, label);

create table if not exists public.industry_aliases (
  industry_id text not null references public.industries(id) on delete cascade,
  alias text not null,
  locale text not null default 'en',
  primary key (industry_id, alias, locale)
);

create table if not exists public.organization_industries (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  industry_id text not null references public.industries(id),
  is_primary boolean not null default false,
  source text not null default 'manual' check (source in ('onboarding', 'manual', 'rinpo', 'import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, industry_id)
);

create unique index if not exists organization_industries_one_primary_idx
  on public.organization_industries(organization_id)
  where is_primary;

alter table public.organization_settings
  add column if not exists primary_industry_id text references public.industries(id),
  add column if not exists business_description text,
  add column if not exists business_stage text,
  add column if not exists website_url text,
  add column if not exists country_code text,
  add column if not exists state_region text,
  add column if not exists city text,
  add column if not exists employee_band text,
  add column if not exists annual_revenue_band text;

comment on column public.organization_settings.primary_industry_id is 'Canonical RINADS industry id. business_type remains as a legacy compatibility field.';
comment on column public.organization_settings.business_description is 'Natural-language description used by RINPO/RINADS Intelligence for classification and provisioning.';
comment on column public.organization_settings.annual_revenue_band is 'Optional onboarding band. Treat as private business profile data.';

alter table public.industry_families enable row level security;
alter table public.industries enable row level security;
alter table public.industry_aliases enable row level security;
alter table public.organization_industries enable row level security;

create policy industry_families_read_active
  on public.industry_families for select to anon, authenticated
  using (is_active);

create policy industries_read_active
  on public.industries for select to anon, authenticated
  using (is_active);

create policy industry_aliases_read
  on public.industry_aliases for select to anon, authenticated
  using (true);

create policy organization_industries_select_member
  on public.organization_industries for select to authenticated
  using (private.is_org_member(organization_id));

create policy organization_industries_insert_member
  on public.organization_industries for insert to authenticated
  with check (private.is_org_member(organization_id));

create policy organization_industries_update_member
  on public.organization_industries for update to authenticated
  using (private.is_org_member(organization_id))
  with check (private.is_org_member(organization_id));

create policy organization_industries_delete_member
  on public.organization_industries for delete to authenticated
  using (private.is_org_member(organization_id));

insert into public.industry_families (id, label, sort_order) values
  ('agriculture-nature', 'Agriculture, Forestry, Fishing & Animal Economy', 10),
  ('mining-resources', 'Mining, Minerals & Natural Resources', 20),
  ('manufacturing-industrial', 'Manufacturing & Industrial', 30),
  ('energy-utilities', 'Energy, Power & Utilities', 40),
  ('construction-infrastructure', 'Construction, Infrastructure & Trades', 50),
  ('wholesale-distribution', 'Wholesale, Distribution & Trading', 60),
  ('retail-commerce', 'Retail & Commerce', 70),
  ('ecommerce-digital-commerce', 'E-commerce & Digital Commerce', 80),
  ('automotive-mobility', 'Automotive & Mobility', 90),
  ('transport-logistics', 'Transportation, Courier & Logistics', 100),
  ('hospitality-tourism', 'Hospitality, Tourism & Accommodation', 110),
  ('food-beverage', 'Food, Beverage & Restaurants', 120),
  ('real-estate-property', 'Real Estate & Property', 130),
  ('professional-services', 'Professional & Business Services', 140),
  ('technology-software', 'Technology, IT, Software & SaaS', 150),
  ('telecom-communications', 'Telecom, Internet & Communications', 160),
  ('finance-insurance', 'Banking, Finance, Fintech & Insurance', 170),
  ('healthcare-life-sciences', 'Healthcare, Medical & Life Sciences', 180),
  ('beauty-wellness', 'Beauty, Wellness & Personal Care', 190),
  ('education-training', 'Education, Training & Academy', 200),
  ('media-advertising', 'Media, Advertising & Publishing', 210),
  ('entertainment-sports', 'Entertainment, Events, Gaming & Sports', 220),
  ('creative-design', 'Creative, Design & Creator Economy', 230),
  ('hr-workforce', 'HR, Recruitment & Workforce', 240),
  ('legal-governance', 'Legal, Compliance & Governance', 250),
  ('government-public', 'Government & Public Sector', 260),
  ('ngo-social', 'NGO, Social Enterprise & Associations', 270),
  ('environment-green', 'Environmental, Waste & Green Economy', 280),
  ('personal-household', 'Household & Personal Services', 290),
  ('emerging-multi', 'Emerging / Other / Multi-industry', 300)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.industries (id, family_id, label, template_key, source, sort_order) values
  ('consulting', 'professional-services', 'Consulting', 'generic-retail', 'uploaded', 10),
  ('accounting', 'professional-services', 'Accounting', 'generic-retail', 'uploaded', 20),
  ('legal-services', 'legal-governance', 'Legal Services', 'generic-retail', 'uploaded', 30),
  ('advertising-marketing', 'media-advertising', 'Advertising & Marketing', 'generic-retail', 'uploaded', 40),
  ('it-managed-services', 'technology-software', 'IT Services & Managed Services', 'generic-retail', 'uploaded', 50),
  ('software-saas', 'technology-software', 'Software & SaaS Companies', 'generic-retail', 'uploaded', 60),
  ('design-services', 'creative-design', 'Design Services', 'generic-retail', 'uploaded', 70),
  ('construction', 'construction-infrastructure', 'Construction', 'generic-retail', 'uploaded', 80),
  ('specialty-trade-contractors', 'construction-infrastructure', 'Specialty Trade Contractors', 'generic-retail', 'uploaded', 90),
  ('retail-brick-mortar', 'retail-commerce', 'Retail (Brick-and-Mortar)', 'generic-retail', 'uploaded', 100),
  ('ecommerce', 'ecommerce-digital-commerce', 'E-commerce', 'generic-retail', 'uploaded', 110),
  ('healthcare-clinics', 'healthcare-life-sciences', 'Healthcare (Clinics & Private Practice)', 'generic-retail', 'uploaded', 120),
  ('food-beverage', 'food-beverage', 'Food & Beverage', 'generic-retail', 'uploaded', 130),
  ('hospitality-lodging', 'hospitality-tourism', 'Hospitality & Lodging', 'generic-retail', 'uploaded', 140),
  ('training-coaching', 'education-training', 'Training, Coaching & Professional Development', 'generic-retail', 'uploaded', 150),
  ('agriculture-forestry-fishing', 'agriculture-nature', 'Agriculture, Forestry & Fishing', 'ambady-nursery', 'uploaded', 160),
  ('architecture', 'professional-services', 'Architecture', 'generic-retail', 'uploaded', 170),
  ('beauty-personal-care', 'beauty-wellness', 'Beauty & Personal Care', 'salon-os', 'uploaded', 180),
  ('biotechnology', 'healthcare-life-sciences', 'Biotechnology', 'generic-retail', 'uploaded', 190),
  ('education-schools-tutoring', 'education-training', 'Education (Schools, Tutoring)', 'generic-retail', 'uploaded', 200),
  ('energy-oil-gas-renewables', 'energy-utilities', 'Energy (Oil, Gas, Renewables)', 'generic-retail', 'uploaded', 210),
  ('entertainment-events', 'entertainment-sports', 'Entertainment & Events', 'generic-retail', 'uploaded', 220),
  ('financial-services', 'finance-insurance', 'Financial Services (Advisory & Planning)', 'generic-retail', 'uploaded', 230),
  ('fitness-sports', 'entertainment-sports', 'Fitness & Sports', 'generic-retail', 'uploaded', 240),
  ('government-public-sector', 'government-public', 'Government (Public Sector)', 'generic-retail', 'uploaded', 250),
  ('human-resources', 'hr-workforce', 'Human Resources', 'generic-retail', 'uploaded', 260),
  ('insurance-agencies-brokers', 'finance-insurance', 'Insurance Agencies & Brokers', 'generic-retail', 'uploaded', 270),
  ('logistics-3pl-fulfillment', 'transport-logistics', 'Logistics (3PL, Fulfillment)', 'generic-retail', 'uploaded', 280),
  ('manufacturing', 'manufacturing-industrial', 'Manufacturing', 'generic-retail', 'uploaded', 290),
  ('media-publishing', 'media-advertising', 'Media & Publishing', 'generic-retail', 'uploaded', 300),
  ('mental-health-services', 'healthcare-life-sciences', 'Mental Health Services', 'generic-retail', 'uploaded', 310),
  ('nonprofit-ngo', 'ngo-social', 'Non-Profit / NGO', 'generic-retail', 'uploaded', 320),
  ('personal-services', 'personal-household', 'Personal Services', 'generic-retail', 'uploaded', 330),
  ('pharmaceuticals', 'healthcare-life-sciences', 'Pharmaceuticals', 'generic-retail', 'uploaded', 340),
  ('property-management', 'real-estate-property', 'Property Management', 'generic-retail', 'uploaded', 350),
  ('real-estate-brokerage-agents', 'real-estate-property', 'Real Estate (Brokerage, Agents)', 'generic-retail', 'uploaded', 360),
  ('telecommunications', 'telecom-communications', 'Telecommunications', 'generic-retail', 'uploaded', 370),
  ('transportation-trucking-courier', 'transport-logistics', 'Transportation (Trucking, Courier)', 'generic-retail', 'uploaded', 380),
  ('utilities', 'energy-utilities', 'Utilities', 'generic-retail', 'uploaded', 390),
  ('wellness-alternative-health', 'beauty-wellness', 'Wellness & Alternative Health', 'salon-os', 'uploaded', 400),
  ('venture-capital-investment', 'finance-insurance', 'Venture Capital / Investment Firms', 'generic-retail', 'uploaded', 410),
  ('other', 'emerging-multi', 'Other / Not Listed', 'generic-retail', 'uploaded', 420),
  ('salon', 'beauty-wellness', 'Salon / Hair / Beauty Studio', 'salon-os', 'rinads', 430),
  ('jewellery-luxury', 'retail-commerce', 'Jewellery & Luxury', 'generic-retail', 'rinads', 440),
  ('nursery-horticulture', 'agriculture-nature', 'Nursery, Horticulture & Garden Retail', 'ambady-nursery', 'rinads', 450),
  ('landscaping', 'agriculture-nature', 'Landscaping & Garden Services', 'ambady-nursery', 'rinads', 460),
  ('automotive-dealership', 'automotive-mobility', 'Automotive Dealership', 'generic-retail', 'rinads', 470),
  ('automotive-service', 'automotive-mobility', 'Automotive Service, Body Shop & Detailing', 'generic-retail', 'rinads', 480),
  ('immigration-services', 'professional-services', 'Immigration, Visa & Overseas Services', 'generic-retail', 'rinads', 490),
  ('courier-delivery', 'transport-logistics', 'Courier, Parcel & Last-mile Delivery', 'generic-retail', 'rinads', 500),
  ('academy-training', 'education-training', 'Academy & Vocational Training', 'generic-retail', 'rinads', 510),
  ('restaurant-cafe', 'food-beverage', 'Restaurant, Cafe & Cloud Kitchen', 'generic-retail', 'rinads', 520)
on conflict (id) do update set
  family_id = excluded.family_id,
  label = excluded.label,
  template_key = excluded.template_key,
  source = excluded.source,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.industry_aliases (industry_id, alias) values
  ('salon', 'beauty salon'),
  ('salon', 'hair salon'),
  ('salon', 'unisex salon'),
  ('jewellery-luxury', 'jewelry'),
  ('jewellery-luxury', 'gold jewellery'),
  ('jewellery-luxury', 'silver jewellery'),
  ('jewellery-luxury', 'diamond jewellery'),
  ('jewellery-luxury', 'bullion'),
  ('nursery-horticulture', 'nursery'),
  ('nursery-horticulture', 'garden center'),
  ('landscaping', 'landscape'),
  ('automotive-dealership', 'car dealer'),
  ('automotive-service', 'body shop'),
  ('immigration-services', 'visa consultant'),
  ('courier-delivery', 'last mile delivery'),
  ('academy-training', 'training center'),
  ('restaurant-cafe', 'cloud kitchen')
on conflict do nothing;
