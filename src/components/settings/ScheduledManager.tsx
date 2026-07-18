import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Clock, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ScheduledTransaction, TransactionType, Frequency } from '@/types'

interface Props {
  scheduled: ScheduledTransaction[]
  onSave: (item: Omit<ScheduledTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_processed_at'>, id?: string) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Giornaliera' },
  { value: 'weekly', label: 'Settimanale' },
  { value: 'monthly', label: 'Mensile' },
  { value: 'yearly', label: 'Annuale' },
]

export default function ScheduledManager({ scheduled, onSave, onToggle, onDelete }: Props) {
  const [editing, setEditing] = useState<ScheduledTransaction | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [interval, setInterval] = useState(1)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  const handleOpenNew = () => {
    setEditing(null)
    setType('expense')
    setAmount('')
    setDescription('')
    setNote('')
    setFrequency('monthly')
    setInterval(1)
    setStartDate(new Date().toISOString().split('T')[0])
    setShowForm(true)
  }

  const handleOpenEdit = (item: ScheduledTransaction) => {
    setEditing(item)
    setType(item.type)
    setAmount(item.amount.toString())
    setDescription(item.description)
    setNote(item.note || '')
    setFrequency(item.frequency)
    setInterval(item.interval_value)
    setStartDate(item.start_date)
    setShowForm(true)
  }

  const handleSubmit = () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || !description.trim()) return

    onSave({
      type,
      amount: numAmount,
      description: description.trim(),
      note: note || undefined,
      frequency,
      interval_value: interval,
      start_date: startDate,
      next_occurrence: startDate,
      is_active: true,
      family_id: null,
      category_id: editing?.category_id || null,
      end_date: null,
    }, editing?.id)

    setShowForm(false)
  }

  const nextDateStr = (date: string, freq: Frequency, int: number) => {
    const d = new Date(date + 'T00:00:00')
    switch (freq) {
      case 'daily': d.setDate(d.getDate() + int); break
      case 'weekly': d.setDate(d.getDate() + 7 * int); break
      case 'monthly': d.setMonth(d.getMonth() + int); break
      case 'yearly': d.setFullYear(d.getFullYear() + int); break
    }
    return format(d, 'd MMM yyyy', { locale: it })
  }

  const freqLabel = (f: Frequency) => FREQUENCIES.find(x => x.value === f)?.label || f

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Transazioni programmate</h2>
        <button onClick={handleOpenNew} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-blue-400">
          <Plus size={14} /> Nuova
        </button>
      </div>

      {scheduled.length === 0 ? (
        <div className="text-center py-8 bg-surface rounded-xl border border-border">
          <Clock size={28} className="text-text-secondary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Nessuna transazione programmata</p>
          <p className="text-xs text-text-tertiary mt-1">Aggiungi spese o entrate ricorrenti</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scheduled.map(item => (
            <div key={item.id} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  item.type === 'income' ? 'text-income bg-income/10' : 'text-expense bg-expense/10'
                }`}>
                  {item.type === 'income' ? 'Entrata' : 'Uscita'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(item)} className="p-1 text-text-secondary hover:text-text-primary">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-1 text-text-secondary hover:text-expense">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm font-medium text-text-primary">{item.description}</p>

              <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                <span className="font-mono font-semibold text-text-primary">
                  € {item.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {freqLabel(item.frequency)}
                  {item.interval_value > 1 && ` ×${item.interval_value}`}
                </span>
                <span>
                  Prossima: {nextDateStr(item.next_occurrence, item.frequency, item.interval_value)}
                </span>
              </div>

              {/* Toggle active */}
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => onToggle(item.id, !item.is_active)}
                  className="flex items-center gap-2 text-xs"
                >
                  {item.is_active ? (
                    <ToggleRight size={18} className="text-income" />
                  ) : (
                    <ToggleLeft size={18} className="text-text-secondary" />
                  )}
                  <span className={item.is_active ? 'text-income' : 'text-text-secondary'}>
                    {item.is_active ? 'Attiva' : 'In pausa'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text-primary">
                {editing ? 'Modifica' : 'Nuova transazione programmata'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex bg-primary/50 rounded-xl p-1">
                {(['expense', 'income'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      type === t ? (t === 'expense' ? 'bg-expense text-white' : 'bg-income text-white') : 'text-text-secondary'
                    }`}
                  >
                    {t === 'expense' ? 'Uscita' : 'Entrata'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Importo (€)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01"
                  className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30 font-mono" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Descrizione</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="es. Affitto mensile"
                  className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30" />
              </div>

              {/* Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Frequenza</label>
                  <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}
                    className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none">
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Ogni</label>
                  <input type="number" value={interval} onChange={e => setInterval(Math.max(1, parseInt(e.target.value) || 1))} min={1}
                    className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30" />
                </div>
              </div>

              {/* Start date */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Data inizio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30 [color-scheme:dark]" />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Nota (opzionale)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Dettagli aggiuntivi..." rows={2}
                  className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30 resize-none" />
              </div>

              <button onClick={handleSubmit} disabled={!amount || !description.trim()}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                  amount && description.trim() ? 'bg-accent text-white hover:bg-blue-600' : 'bg-border text-text-secondary cursor-not-allowed'
                }`}>
                {editing ? 'Salva modifiche' : 'Crea transazione programmata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
