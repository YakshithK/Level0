create table users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    username text not null,
    password_hash text,
    created_at timestamp with time zone default now()
)