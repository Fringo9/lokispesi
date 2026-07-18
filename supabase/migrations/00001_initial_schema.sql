-- ============================================================
-- LokiSpesi: Initial Database Schema
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Family Groups
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE family_members (
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (family_id, profile_id)
);

-- 3. Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#6B7280',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user ON categories(user_id);

-- 4. Scheduled Transactions
CREATE TABLE scheduled_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_value INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  last_processed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scheduled_next ON scheduled_transactions(next_occurrence) WHERE is_active = true;

-- 5. Bank Connections
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  requisition_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Bank Accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT,
  account_iban TEXT,
  balance DECIMAL(12, 2),
  requisition_id TEXT,
  agreement_id TEXT,
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, account_id)
);

CREATE INDEX idx_bank_accounts_user ON bank_accounts(user_id);

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'EUR',
  booking_date DATE NOT NULL,
  value_date DATE,
  bank_category TEXT,
  metadata JSONB,
  imported_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bank_account_id, transaction_id)
);

-- 7. Transactions (core table)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES family_groups(id),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_id UUID REFERENCES scheduled_transactions(id) ON DELETE SET NULL,
  external_id TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  linked_bank_tx UUID REFERENCES bank_transactions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_external ON transactions(external_id);

-- 8. Manual Wallets
CREATE TABLE manual_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('cash', 'savings', 'investment', 'other')),
  is_included_in_net_worth BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Wallet Snapshots
CREATE TABLE wallet_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_balance DECIMAL(14,2) NOT NULL,
  bank_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  manual_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_snapshots_user_date ON wallet_snapshots(user_id, snapshot_date DESC);

-- 10. Sync Queue
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- 11. Sync Log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  conflict BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = (SELECT auth.uid()));

-- Category policies
CREATE POLICY "Users can CRUD own categories" ON categories USING (user_id = (SELECT auth.uid()));

-- Transaction policies
CREATE POLICY "Users can CRUD own transactions" ON transactions USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Family can view shared transactions" ON transactions FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE profile_id = (SELECT auth.uid())));

-- Scheduled transaction policies
CREATE POLICY "Users can CRUD own scheduled transactions" ON scheduled_transactions USING (user_id = (SELECT auth.uid()));

-- Bank connection policies
CREATE POLICY "Users can CRUD own bank connections" ON bank_connections USING (user_id = (SELECT auth.uid()));

-- Bank account policies
CREATE POLICY "Users can CRUD own bank accounts" ON bank_accounts USING (user_id = (SELECT auth.uid()));

-- Bank transaction policies
CREATE POLICY "Users can view own bank transactions" ON bank_transactions
  USING (bank_account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT auth.uid())));

-- Manual wallet policies
CREATE POLICY "Users can CRUD own wallets" ON manual_wallets USING (user_id = (SELECT auth.uid()));

-- Wallet snapshot policies
CREATE POLICY "Users can CRUD own snapshots" ON wallet_snapshots USING (user_id = (SELECT auth.uid()));

-- Family policies
CREATE POLICY "Members can view their families" ON family_groups FOR SELECT
  USING (id IN (SELECT family_id FROM family_members WHERE profile_id = (SELECT auth.uid())));
CREATE POLICY "Admins can manage families" ON family_groups FOR ALL
  USING (created_by = (SELECT auth.uid()));
CREATE POLICY "Members can view family membership" ON family_members FOR SELECT
  USING (family_id IN (SELECT id FROM family_groups WHERE created_by = (SELECT auth.uid()))
         OR profile_id = (SELECT auth.uid()));

-- Sync policies
CREATE POLICY "Users can CRUD own sync queue" ON sync_queue USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can CRUD own sync log" ON sync_log USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE
  transactions, categories, bank_accounts, manual_wallets, wallet_snapshots, family_members;
