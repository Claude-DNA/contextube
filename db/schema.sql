-- ConteXtube core schema v1. Safe to run more than once.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS flows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  creator_name text,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_units (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id       uuid REFERENCES flows(id) ON DELETE SET NULL,
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  language      text NOT NULL DEFAULT 'en',
  tags          text[] NOT NULL DEFAULT '{}',
  domains       text[] NOT NULL DEFAULT '{}',
  source_title  text,
  source_author text,
  rights        text NOT NULL DEFAULT 'own' CHECK (rights IN ('own', 'public_domain', 'copyrighted')),
  purchase_url  text,
  status        text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  chunk_count   integer NOT NULL DEFAULT 0,
  total_tokens  integer NOT NULL DEFAULT 0,
  published_by  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Covers: one image per flow and per work, as {url, alt, credit, source}.
ALTER TABLE flows ADD COLUMN IF NOT EXISTS cover jsonb;
ALTER TABLE content_units ADD COLUMN IF NOT EXISTS cover jsonb;

CREATE TABLE IF NOT EXISTS chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   uuid NOT NULL REFERENCES content_units(id) ON DELETE CASCADE,
  layer        smallint NOT NULL CHECK (layer BETWEEN 1 AND 5),
  chunk_type   text NOT NULL DEFAULT 'idea' CHECK (chunk_type IN ('idea', 'narrative', 'meta')),
  position     integer NOT NULL DEFAULT 0,
  extract      text,
  text         text NOT NULL,
  source_quote text,
  tokens       integer NOT NULL DEFAULT 0,
  importance   real NOT NULL DEFAULT 0.5 CHECK (importance BETWEEN 0 AND 1),
  tags         text[] NOT NULL DEFAULT '{}',
  images       jsonb NOT NULL DEFAULT '[]',
  metadata     jsonb NOT NULL DEFAULT '{}',
  -- 'simple' config keeps search language-neutral (English and Russian content side by side).
  search       tsvector GENERATED ALWAYS AS (
                 setweight(to_tsvector('simple', coalesce(extract, '')), 'A') ||
                 setweight(to_tsvector('simple', coalesce(text, '')), 'B') ||
                 setweight(to_tsvector('simple', coalesce(source_quote, '')), 'C')
               ) STORED,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_content_layer_idx ON chunks (content_id, layer, position);
CREATE INDEX IF NOT EXISTS chunks_search_idx ON chunks USING gin (search);
CREATE INDEX IF NOT EXISTS units_status_idx ON content_units (status, created_at DESC);
CREATE INDEX IF NOT EXISTS units_tags_idx ON content_units USING gin (tags);
CREATE INDEX IF NOT EXISTS units_domains_idx ON content_units USING gin (domains);

-- Clouds: a work's story bible as published from Context Cloud Studio (the old /cloud pages).
-- Elements are grouped by kind: plot (beats, in story order), characters, stage (places),
-- universe (world rules), ideas and references.
CREATE TABLE IF NOT EXISTS clouds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  genre         text,
  creator_name  text,
  flow_id       uuid REFERENCES flows(id) ON DELETE SET NULL,
  work_slug     text,
  rights        text NOT NULL DEFAULT 'own' CHECK (rights IN ('own', 'public_domain', 'copyrighted')),
  source_title  text,
  source_author text,
  purchase_url  text,
  cover         jsonb,
  element_count integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  published_by  text,
  -- For writers that publish for many people (Studio): whose cloud this is, so one user can't overwrite another's.
  owner         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_elements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_id   uuid NOT NULL REFERENCES clouds(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('plot', 'characters', 'stage', 'universe', 'ideas', 'references')),
  position   integer NOT NULL DEFAULT 0,
  title      text NOT NULL,
  text       text NOT NULL DEFAULT '',
  image      jsonb,
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Works published by multi-user writers (Studio) record whose they are, as clouds do.
ALTER TABLE content_units ADD COLUMN IF NOT EXISTS owner text;

CREATE INDEX IF NOT EXISTS cloud_elements_cloud_idx ON cloud_elements (cloud_id, kind, position);
CREATE INDEX IF NOT EXISTS clouds_status_idx ON clouds (status, updated_at DESC);
