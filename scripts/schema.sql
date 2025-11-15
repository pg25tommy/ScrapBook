-- Database schema for Light Table scrapbook application
-- Run this after setting up Vercel Postgres

-- Scrapbook Pages Table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  slot_data JSONB NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup by slug
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- Index for faster lookup of published pages
CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(published) WHERE published = true;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
-- INSERT INTO pages (title, slug, slot_data, published) VALUES
--   ('Welcome', 'welcome', '{"id":"1","x":0,"y":0,"width":520,"height":420,"content":{"kind":"text","text":"Welcome to my scrapbook!"}}', true),
--   ('Summer 2024', 'summer-2024', '{"id":"2","x":0,"y":0,"width":520,"height":420}', false);