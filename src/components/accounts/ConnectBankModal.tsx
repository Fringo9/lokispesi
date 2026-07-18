import { useState } from 'react'
import { X, Search, Landmark, Building2, ChevronRight } from 'lucide-react'

interface Bank {
  id: string
  name: string
  logo?: string
  bic?: string
}

// Top Italian banks supported by GoCardless
const ITALIAN_BANKS: Bank[] = [
  { id: 'BANCA_SELLA_SELBIT2B', name: 'Banca Sella', bic: 'SELBIT2B' },
  { id: 'REVOLUT_REVOGB21', name: 'Revolut', bic: 'REVOGB21' },
  { id: 'BBVA_BBVAITMMXXX', name: 'BBVA', bic: 'BBVAITMM' },
  { id: 'INTESA_SANPAOLO_BCITITMM', name: 'Intesa Sanpaolo', bic: 'BCITITMM' },
  { id: 'UNICREDIT_UNCRITMM', name: 'UniCredit', bic: 'UNCRITMM' },
  { id: 'BANCO_BPM_BAPPIT22', name: 'Banco BPM', bic: 'BAPPIT22' },
  { id: 'NEXI_NEXIITMM', name: 'Nexi', bic: 'NEXIITMM' },
  { id: 'FINECO_FEBIITM2', name: 'Fineco', bic: 'FEBIITM2' },
  { id: 'WIDIBA_WIDIITMM', name: 'Widiba', bic: 'WIDIITMM' },
  { id: 'N26_NTSBDEB1', name: 'N26', bic: 'NTSBDEB1' },
  { id: 'ILLIMITY_ITTPAYIT', name: 'Illimity Bank', bic: 'ITTPAYIT' },
  { id: 'BANCA_MEDIOLANUM', name: 'Banca Mediolanum', bic: 'MEDBITMM' },
  { id: 'CHEBANCA', name: 'CheBanca!', bic: 'CHEBITMM' },
  { id: 'POSTE_ITALIANE_BPPIITRR', name: 'Poste Italiane', bic: 'BPPIITRR' },
  { id: 'CREDIT_AGRICOLE_CRPPIT2P', name: 'Crédit Agricole Italia', bic: 'CRPPIT2P' },
]

interface Props {
  onClose: () => void
  onSelect: (bank: Bank) => void
}

export default function ConnectBankModal({ onClose, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const filtered = ITALIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConnect = async () => {
    if (!selectedBank) return
    setIsConnecting(true)

    try {
      // In production: call connectBank(selectedBank.id) from gocardless.ts
      // For now, simulate connection
      await new Promise(r => setTimeout(r, 1500))
      onSelect(selectedBank)
    } catch (err) {
      console.error('Bank connection failed:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 max-h-[85dvh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-lg font-semibold text-text-primary">Collega banca</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/50 text-text-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 bg-primary/50 rounded-xl px-4 py-2.5 border border-border">
            <Search size={16} className="text-text-secondary flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca la tua banca..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
              autoFocus
            />
          </div>

          {/* Bank list */}
          <div className="space-y-1">
            {filtered.map(bank => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedBank?.id === bank.id
                    ? 'bg-accent/15 border border-accent/30'
                    : 'hover:bg-primary/50 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-text-secondary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-text-primary">{bank.name}</p>
                  {bank.bic && (
                    <p className="text-xs text-text-secondary">{bank.bic}</p>
                  )}
                </div>
                <ChevronRight size={16} className={`text-text-secondary transition-colors ${selectedBank?.id === bank.id ? 'text-accent' : ''}`} />
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <Landmark size={32} className="text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Nessuna banca trovata</p>
              </div>
            )}
          </div>

          {/* Connect button */}
          {selectedBank && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                isConnecting
                  ? 'bg-border text-text-secondary cursor-wait'
                  : 'bg-accent text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-accent/25'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeLinecap="round" opacity="0.3"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeLinecap="round" strokeDashoffset="25"/>
                  </svg>
                  Connessione in corso...
                </span>
              ) : (
                `Connetti a ${selectedBank.name}`
              )}
            </button>
          )}

          <p className="text-[11px] text-text-tertiary text-center leading-relaxed">
            Utilizziamo GoCardless per connetterci in modo sicuro ai tuoi conti bancari.
            I tuoi dati sono protetti secondo lo standard PSD2.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
