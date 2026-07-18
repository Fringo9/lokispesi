// ============================================================
// Core types for LokiSpesi
// ============================================================

// --- Enums / Unions ---
export type TransactionType = 'income' | 'expense'
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type WalletType = 'cash' | 'savings' | 'investment' | 'other'
export type BankAccountStatus = 'active' | 'expired' | 'error'
export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'processing' | 'failed' | 'synced'
export type FamilyRole = 'admin' | 'member'
export type CategoryFilter = 'income' | 'expense' | 'both'

// --- Category ---
export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: CategoryFilter
  is_default: boolean
  created_at: string
}

// --- Transaction ---
export interface Transaction {
  id: string
  user_id: string
  family_id?: string | null
  category_id?: string | null
  bank_account_id?: string | null
  type: TransactionType
  amount: number
  description?: string
  note?: string
  transaction_date: string
  is_recurring: boolean
  recurring_id?: string | null
  external_id?: string | null
  is_reconciled?: boolean
  linked_bank_tx?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
}

// --- Manual Wallet ---
export interface ManualWallet {
  id: string
  user_id: string
  name: string
  balance: number
  type: WalletType
  is_included_in_net_worth: boolean
  created_at: string
  updated_at: string
}

// --- Wallet Snapshot ---
export interface WalletSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  total_balance: number
  bank_balance: number
  manual_balance: number
  created_at: string
}

// --- Bank Connection ---
export interface BankConnection {
  id: string
  user_id: string
  institution_name: string
  institution_id: string
  requisition_id: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  last_synced_at?: string
  is_active: boolean
  created_at: string
}

// --- Bank Account ---
export interface BankAccount {
  id: string
  user_id: string
  connection_id?: string
  institution_id: string
  institution_name: string
  account_id: string
  account_name?: string
  account_iban?: string
  balance?: number
  requisition_id?: string
  agreement_id?: string
  last_synced_at?: string
  status: BankAccountStatus
  created_at: string
}

// --- Bank Transaction ---
export interface BankTransaction {
  id: string
  bank_account_id: string
  transaction_id: string
  amount: number
  description?: string
  currency: string
  booking_date: string
  value_date?: string
  bank_category?: string
  metadata?: Record<string, unknown>
  imported_at: string
}

// --- Scheduled Transaction ---
export interface ScheduledTransaction {
  id: string
  user_id: string
  family_id?: string | null
  category_id?: string | null
  type: TransactionType
  amount: number
  description: string
  note?: string
  frequency: Frequency
  interval_value: number
  start_date: string
  end_date?: string | null
  next_occurrence: string
  last_processed_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  category?: Category
}

// --- Family ---
export interface FamilyGroup {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface FamilyMember {
  family_id: string
  profile_id: string
  role: FamilyRole
  joined_at: string
}

// --- Profile ---
export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  currency: string
  created_at: string
  updated_at: string
}

// --- Sync ---
export interface SyncQueueItem {
  localId?: number
  entity_type: string
  entity_id?: string
  action: SyncOperation
  payload: Record<string, unknown>
  status: SyncStatus
  retryCount: number
  created_at: string
}

// --- Monthly Summary (computed) ---
export interface MonthlySummary {
  month: string // 'YYYY-MM'
  income: number
  expense: number
  net: number
}

// --- Chart Data ---
export interface ChartDataPoint {
  name: string
  income?: number
  expense?: number
  netWorth?: number
  value?: number
  fill?: string
}

// --- Form Types ---
export interface ExpenseFormData {
  amount: number
  type: TransactionType
  category_id: string
  transaction_date: string
  note?: string
  description?: string
  family_id?: string | null
}
