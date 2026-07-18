import Dexie, { type Table } from 'dexie'
import type { Transaction, Category, ManualWallet, SyncQueueItem } from '@/types'

export class LokiSpesiDB extends Dexie {
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  walletAccounts!: Table<ManualWallet, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('lokispesi')

    this.version(1).stores({
      transactions:
        'id, user_id, family_id, type, transaction_date, category_id, [user_id+transaction_date], [user_id+type]',
      categories: 'id, user_id, type, [user_id+name]',
      walletAccounts: 'id, user_id, type',
      syncQueue: '++localId, entity_type, action, status, created_at',
    })
  }

  // --- Transactions ---

  async getTransactionsByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<Transaction[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    return this.transactions
      .where('[user_id+transaction_date]')
      .between([userId, start], [userId, end])
      .reverse()
      .toArray()
  }

  async getTransactionsByDateRange(
    userId: string,
    start: string,
    end: string
  ): Promise<Transaction[]> {
    return this.transactions
      .where('[user_id+transaction_date]')
      .between([userId, start], [userId, end])
      .reverse()
      .toArray()
  }

  async searchTransactions(userId: string, query: string): Promise<Transaction[]> {
    const q = query.toLowerCase()
    const all = await this.transactions
      .where('user_id')
      .equals(userId)
      .toArray()

    return all.filter((tx) => {
      const desc = tx.description?.toLowerCase() ?? ''
      const note = tx.note?.toLowerCase() ?? ''
      const amount = tx.amount.toString()
      const category = tx.category?.name.toLowerCase() ?? ''
      return desc.includes(q) || note.includes(q) || amount.includes(q) || category.includes(q)
    }).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }

  async upsertTransactions(transactions: Transaction[]): Promise<void> {
    await this.transactions.bulkPut(transactions)
  }

  // --- Categories ---

  async getCategories(userId: string): Promise<Category[]> {
    return this.categories.where('user_id').equals(userId).toArray()
  }

  async upsertCategories(categories: Category[]): Promise<void> {
    await this.categories.bulkPut(categories)
  }

  // --- Wallet Accounts ---

  async getWalletAccounts(userId: string): Promise<ManualWallet[]> {
    return this.walletAccounts.where('user_id').equals(userId).toArray()
  }

  async upsertWalletAccounts(wallets: ManualWallet[]): Promise<void> {
    await this.walletAccounts.bulkPut(wallets)
  }

  // --- Sync Queue ---

  async getPendingSync(): Promise<SyncQueueItem[]> {
    return this.syncQueue.where('status').equals('pending').sortBy('created_at')
  }

  async enqueueSync(item: Omit<SyncQueueItem, 'localId'>): Promise<number> {
    return this.syncQueue.add(item as SyncQueueItem)
  }

  async updateSyncStatus(
    localId: number,
    status: SyncQueueItem['status'],
    retryCount?: number
  ): Promise<void> {
    const update: Partial<SyncQueueItem> = { status }
    if (retryCount !== undefined) update.retryCount = retryCount
    await this.syncQueue.update(localId, update)
  }

  async clearSyncedItems(): Promise<void> {
    await this.syncQueue.where('status').equals('synced').delete()
  }

  // --- Full sync ---

  async pullFromServer(
    userId: string,
    transactions: Transaction[],
    categories: Category[],
    wallets: ManualWallet[]
  ): Promise<void> {
    await this.transactions.where('user_id').equals(userId).delete()
    await this.categories.where('user_id').equals(userId).delete()
    await this.walletAccounts.where('user_id').equals(userId).delete()

    await this.transactions.bulkPut(transactions)
    await this.categories.bulkPut(categories)
    await this.walletAccounts.bulkPut(wallets)
  }
}

export const localDB = new LokiSpesiDB()
