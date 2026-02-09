create table if not exists market_events (
  id bigserial primary key,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists market_scores (
  id bigserial primary key,
  score_type text not null,
  entity_id text not null,
  score_value numeric not null,
  metadata jsonb not null,
  created_at timestamptz not null default now()
);
