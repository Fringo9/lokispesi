-- ============================================================
-- Seed: Default Categories
-- ============================================================

-- These are inserted via the app signup flow, but we seed them
-- here for reference. In production, use the seed SQL in Supabase.

INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES
  -- Income
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Stipendio', 'briefcase', '#22C55E', 'income', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Freelance', 'laptop', '#16A34A', 'income', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Affitto (entrata)', 'building', '#8B5CF6', 'income', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Altro (entrate)', 'ellipsis', '#6B7280', 'income', true),
  -- Expense
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Affitto/Mutuo', 'home', '#EF4444', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Bollette', 'zap', '#F97316', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Spesa alimentare', 'shopping-cart', '#EAB308', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Trasporti', 'car', '#3B82F6', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Ristoranti', 'utensils-crossed', '#EC4899', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Salute', 'heart-pulse', '#14B8A6', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Intrattenimento', 'tv', '#8B5CF6', 'expense', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Abbigliamento', 'shirt', '#F43F5E', 'expense', true),
  -- Both
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Investimenti', 'trending-up', '#06B6D4', 'both', true),
  (gen_random_uuid(), (SELECT id FROM profiles LIMIT 1), 'Altro', 'ellipsis', '#6B7280', 'both', true);
