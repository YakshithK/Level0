-- Users table
create table if not exists users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    username text not null,
    password_hash text,
    created_at timestamp with time zone default now()
);

-- Projects table
create table if not exists projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    code text,
    name varchar(255) not null,
    created_at timestamp with time zone default now()
);

-- Chat messages table
create table if not exists chat_messages (
    id uuid primary key default gen_random_uuid(),
    connection_id uuid not null references projects(id) on delete cascade,
    sender varchar(255) not null check (sender in ('user', 'ai')),
    message text not null,
    created_at timestamp with time zone default now()
);
