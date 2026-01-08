-- Add keywords JSONB column to instructions table for improved AI retrieval
ALTER TABLE instructions
ADD COLUMN keywords JSONB DEFAULT '[]';

-- Create GIN index for fast keyword search
CREATE INDEX idx_instructions_keywords ON instructions USING GIN (keywords);

-- Example keywords format: ["brann", "sikkerhet", "evakuering", "pulver", "slukkeutstyr"]
