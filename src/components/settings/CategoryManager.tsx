import { useState } from 'react'
import { X, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Category, CategoryFilter } from '@/types'

// Default colors for category color picker
const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#06B6D4',
  '#84CC16', '#6366F1', '#78716C',
]

const CATEGORY_TYPES: { value: CategoryFilter; label: string }[] = [
  { value: 'expense', label: 'Uscita' },
  { value: 'income', label: 'Entrata' },
  { value: 'both', label: 'Entrambe' },
]

interface Props {
  categories: Category[]
  onSave: (cat: { name: string; icon: string; color: string; type: CategoryFilter }, id?: string) => void
  onDelete: (id: string) => void
}

export default function CategoryManager({ categories, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [type, setType] = useState<CategoryFilter>('expense')

  const handleOpenNew = () => {
    setEditing(null)
    setName('')
    setColor('#3B82F6')
    setType('expense')
    setShowForm(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setColor(cat.color)
    setType(cat.type)
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), icon: 'tag', color, type }, editing?.id)
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Categorie</h2>
        <button onClick={handleOpenNew} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-blue-400">
          <Plus size={14} /> Nuova
        </button>
      </div>

      {/* Category list */}
      <div className="space-y-1">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{cat.name}</p>
              <p className="text-[10px] text-text-secondary capitalize">
                {cat.type === 'income' ? 'Entrata' : cat.type === 'expense' ? 'Uscita' : 'Entrambe'}
                {cat.is_default && ' · Predefinita'}
              </p>
            </div>
            <button onClick={() => handleOpenEdit(cat)} className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary">
              <Pencil size={14} />
            </button>
            {!cat.is_default && (
              <button onClick={() => onDelete(cat.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-expense">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text-primary">
                {editing ? 'Modifica categoria' : 'Nuova categoria'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Nome</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="es. Abbonamenti"
                  className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30"
                  autoFocus
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Colore</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl border-2 border-border" style={{ backgroundColor: color }} />
                  <span className="text-xs text-text-secondary font-mono">{color}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Tipo</label>
                <div className="flex gap-2">
                  {CATEGORY_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        type === t.value ? 'bg-accent text-white' : 'bg-primary/50 text-text-secondary border border-border'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-primary/30 rounded-xl">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                </div>
                <span className="text-sm text-text-primary">{name || 'Anteprima'}</span>
                <span className="text-xs text-text-secondary ml-auto">
                  {type === 'income' ? 'Entrata' : type === 'expense' ? 'Uscita' : 'Entrambe'}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                  name.trim() ? 'bg-accent text-white hover:bg-blue-600' : 'bg-border text-text-secondary cursor-not-allowed'
                }`}
              >
                {editing ? 'Salva modifiche' : 'Crea categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Add keyframe animation to the page
export const slideUpStyle = `
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
`
