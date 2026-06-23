-- Run this in the Supabase SQL Editor

-- 1. Create the 'recetas' table
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio TEXT NOT NULL UNIQUE,
    expediente TEXT NOT NULL,
    paciente TEXT,
    medico TEXT,
    estado TEXT DEFAULT 'Pendiente',
    fecha TIMESTAMPTZ DEFAULT NOW(),
    medicamentos JSONB NOT NULL,
    tiene_alerta BOOLEAN DEFAULT FALSE,
    alerta_msg TEXT
);

-- 2. Optional: Enable Row Level Security (RLS)
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anonymous reads and inserts (for this prototype)
-- In a real production app, you should restrict this to authenticated users.
CREATE POLICY "Allow public select on recetas" ON recetas
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert on recetas" ON recetas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on recetas" ON recetas
    FOR UPDATE USING (true);
