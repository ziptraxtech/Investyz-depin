create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_user_id text not null unique,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_unique_idx on users (lower(email));
create index if not exists users_phone_idx on users (phone);

create table if not exists investor_kyc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pan_number_encrypted text,
  pan_hash text,
  pan_masked text,
  pan_last4 text,
  pan_verified boolean not null default false,
  pan_name text,
  pan_reference_id text,
  digilocker_verified boolean not null default false,
  digilocker_reference_id text,
  digilocker_state text,
  digilocker_status text,
  digilocker_init_txn_id text,
  digilocker_access_token_encrypted text,
  digilocker_access_token_expires_at timestamptz,
  digilocker_documents jsonb not null default '[]'::jsonb,
  digilocker_profile jsonb not null default '{}'::jsonb,
  kyc_status text not null default 'NOT_STARTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at timestamptz
);

create unique index if not exists investor_kyc_user_unique_idx on investor_kyc (user_id);
create unique index if not exists investor_kyc_pan_hash_unique_idx on investor_kyc (pan_hash) where pan_hash is not null;
create index if not exists investor_kyc_status_idx on investor_kyc (kyc_status);
create index if not exists investor_kyc_pan_reference_idx on investor_kyc (pan_reference_id);
create index if not exists investor_kyc_digilocker_reference_idx on investor_kyc (digilocker_reference_id);

create table if not exists verification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  provider text not null,
  api_type text not null,
  request_id text,
  response_status text,
  http_status integer,
  direction text not null default 'outbound',
  event_type text,
  callback_transaction_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verification_logs_user_idx on verification_logs (user_id, created_at desc);
create index if not exists verification_logs_provider_idx on verification_logs (provider, api_type, created_at desc);
create index if not exists verification_logs_request_idx on verification_logs (request_id);
create unique index if not exists verification_logs_callback_unique_idx on verification_logs (callback_transaction_id) where callback_transaction_id is not null;
