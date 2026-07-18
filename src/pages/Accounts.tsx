import { useState, useEffect } from 'react'
import { Landmark, Plus, CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ConnectBankModal from '@/components/accounts/ConnectBankModal'
import BankCard from '@/components/accounts/BankCard'
import type { BankAccount } from '@/types'

// Demo connected accounts for UI demonstration
const DEMO_ACCOUNTS: BankAccount[] = []

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showConnect, setShowConnect] = useState(false)
  const [accounts, setAccounts] = useState<BankAccount[]>(DEMO_ACCOUNTS)
  const [, setSyncingId] = useState<string | null>(null)
  const [callbackMessage, setCallbackMessage] = useState<string | null>(null)

  // Handle GoCardless callback
  useEffect(() => {
    const connected = searchParams.get('connected')
    const count = searchParams.get('accounts')
    if (connected === 'true') {
      setCallbackMessage(`${count || '1'} conto${count === '1' ? '' : 'i'} collegato${count === '1' ? '' : 'i'} con successo!`)
      // Clean URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('connected')
      newParams.delete('accounts')
      setSearchParams(newParams, { replace: true })
      // Auto-dismiss message
      setTimeout(() => setCallbackMessage(null), 5000)
    }
  }, [])

  const handleBankSelect = (bank: { id: string; name: string; bic?: string }) => {
    setShowConnect(false)
    // In production: call connectBank(bank.id) → redirect to GoCardless
    // Simulate for demo
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      user_id: 'demo',
      institution_id: bank.id,
      institution_name: bank.name,
      account_id: 'acct_' + bank.id.slice(0, 8),
      account_name: `${bank.name} ••••${Math.floor(Math.random() * 9000) + 1000}`,
      account_iban: 'IT' + 'X'.repeat(22),
      balance: Math.round(Math.random() * 15000 * 100) / 100,
      status: 'active',
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    setAccounts(prev => [...prev, newAccount])
    setCallbackMessage(`${bank.name} collegata con successo!`)
    setTimeout(() => setCallbackMessage(null), 4000)
  }

  const handleSync = async (accountId: string) => {
    setSyncingId(accountId)
    // In production: call syncBankAccount(accountId)
    await new Promise(r => setTimeout(r, 1500))
    // Update balance with a small random change
    setAccounts(prev => prev.map(a =>
      a.id === accountId
        ? { ...a, balance: (a.balance ?? 0) + Math.round((Math.random() - 0.3) * 200 * 100) / 100, last_synced_at: new Date().toISOString() }
        : a
    ))
    setSyncingId(null)
  }

  const handleRemove = (accountId: string) => {
    setAccounts(prev => prev.filter(a => a.id !== accountId))
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">Conti bancari</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Success callback message */}
        {callbackMessage && (
          <div className="flex items-center gap-2 px-4 py-3 bg-income/10 border border-income/20 rounded-xl animate-slide-up">
            <CheckCircle2 size={16} className="text-income flex-shrink-0" />
            <p className="text-sm text-income font-medium">{callbackMessage}</p>
          </div>
        )}

        {/* Connect button */}
        <button
          onClick={() => setShowConnect(true)}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-blue-600
                         text-white font-medium py-3.5 rounded-xl transition-colors text-sm
                         shadow-lg shadow-accent/25 active:scale-[0.98]"
        >
          <Plus size={18} /> Collega un conto bancario
        </button>

        {/* Connected accounts */}
        {accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map(account => (
              <BankCard
                key={account.id}
                account={account}
                onSync={handleSync}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4">
              <Landmark size={36} className="text-text-secondary" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-2">
              Nessun conto collegato
            </h2>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Collega i tuoi conti bancari per importare automaticamente le transazioni.
              Supportiamo Banca Sella, Revolut, BBVA e molte altre banche italiane via GoCardless.
            </p>

            {/* Supported banks badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                { name: 'Banca Sella', highlight: true },
                { name: 'Revolut', highlight: true },
                { name: 'BBVA', highlight: true },
                { name: 'Intesa Sanpaolo' },
                { name: 'UniCredit' },
                { name: 'Fineco' },
                { name: 'N26' },
                { name: 'Poste Italiane' },
              ].map(bank => (
                <span
                  key={bank.name}
                  className={`text-[10px] px-2.5 py-1 rounded-full border text-text-secondary transition-colors ${
                    bank.highlight
                      ? 'bg-accent/10 border-accent/20 text-accent'
                      : 'bg-surface border-border'
                  }`}
                >
                  {bank.name}
                </span>
              ))}
            </div>

            {/* PSD2 notice */}
            <p className="text-[10px] text-text-tertiary mt-4 max-w-xs leading-relaxed">
              Connessione sicura tramite GoCardless (PSD2). Le tue credenziali bancarie non vengono mai condivise con noi.
              Dovrai riautorizzare l'accesso ogni 90 giorni come richiesto dalla normativa europea.
            </p>
          </div>
        )}
      </div>

      {/* Connect Bank Modal */}
      {showConnect && (
        <ConnectBankModal
          onClose={() => setShowConnect(false)}
          onSelect={handleBankSelect}
        />
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
