import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Tag, Clock, Users, ChevronRight, Camera, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import CategoryManager from '@/components/settings/CategoryManager'
import ScheduledManager from '@/components/settings/ScheduledManager'
import FamilyManager from '@/components/settings/FamilyManager'
import type { Category, CategoryFilter, ScheduledTransaction, FamilyGroup, FamilyMember } from '@/types'

// Demo data
const DEMO_CATEGORIES: Category[] = [
  { id: 'c1', user_id: 'demo', name: 'Stipendio', icon: 'briefcase', color: '#22C55E', type: 'income', is_default: true, created_at: '' },
  { id: 'c2', user_id: 'demo', name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444', type: 'expense', is_default: true, created_at: '' },
  { id: 'c3', user_id: 'demo', name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308', type: 'expense', is_default: true, created_at: '' },
  { id: 'c4', user_id: 'demo', name: 'Bollette', icon: 'zap', color: '#F97316', type: 'expense', is_default: true, created_at: '' },
  { id: 'c5', user_id: 'demo', name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899', type: 'expense', is_default: true, created_at: '' },
  { id: 'c6', user_id: 'demo', name: 'Trasporti', icon: 'car', color: '#3B82F6', type: 'expense', is_default: true, created_at: '' },
  { id: 'c7', user_id: 'demo', name: 'Intrattenimento', icon: 'tv', color: '#8B5CF6', type: 'expense', is_default: true, created_at: '' },
]

const DEMO_SCHEDULED: ScheduledTransaction[] = [
  {
    id: 's1', user_id: 'demo', type: 'expense', amount: 890, description: 'Affitto',
    frequency: 'monthly', interval_value: 1, start_date: '2026-01-01', next_occurrence: '2026-08-01',
    is_active: true, created_at: '', updated_at: '', note: 'Bonifico automatico'
  },
  {
    id: 's2', user_id: 'demo', type: 'income', amount: 2500, description: 'Stipendio',
    frequency: 'monthly', interval_value: 1, start_date: '2026-01-15', next_occurrence: '2026-08-15',
    is_active: true, created_at: '', updated_at: ''
  },
]

type SettingsSection = 'menu' | 'categories' | 'scheduled' | 'family'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [section, setSection] = useState<SettingsSection>('menu')
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES)
  const [scheduled, setScheduled] = useState<ScheduledTransaction[]>(DEMO_SCHEDULED)
  const [family, setFamily] = useState<FamilyGroup | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])

  const handleLogout = async () => {
    await signOut()
    navigate('/auth', { replace: true })
  }

  // Category handlers
  const handleSaveCategory = (cat: { name: string; icon: string; color: string; type: CategoryFilter }, id?: string) => {
    if (id) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: cat.name, color: cat.color, type: cat.type } : c))
    } else {
      setCategories(prev => [...prev, {
        id: crypto.randomUUID(), user_id: 'demo', ...cat, is_default: false, created_at: new Date().toISOString()
      }])
    }
  }
  const handleDeleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id))

  // Scheduled handlers
  const handleSaveScheduled = (data: Omit<ScheduledTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_processed_at'>, id?: string) => {
    if (id) {
      setScheduled(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    } else {
      setScheduled(prev => [...prev, {
        id: crypto.randomUUID(), user_id: 'demo', ...data,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      } as ScheduledTransaction])
    }
  }
  const handleToggleScheduled = (id: string, active: boolean) => {
    setScheduled(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s))
  }
  const handleDeleteScheduled = (id: string) => setScheduled(prev => prev.filter(s => s.id !== id))

  // Family handlers
  const handleCreateFamily = (name: string) => {
    setFamily({ id: crypto.randomUUID(), name, created_by: 'demo', created_at: new Date().toISOString() })
    setMembers([{ family_id: 'new', profile_id: 'demo', role: 'admin', joined_at: new Date().toISOString() }])
  }
  const handleInviteMember = (_email: string) => {
    setMembers(prev => [...prev, {
      family_id: family!.id, profile_id: crypto.randomUUID(), role: 'member', joined_at: new Date().toISOString()
    }])
  }

  // Back to menu
  const goBack = () => setSection('menu')

  const renderSection = () => {
    switch (section) {
      case 'categories':
        return (
          <div>
            <button onClick={goBack} className="text-sm text-accent mb-4 flex items-center gap-1">
              ← Indietro
            </button>
            <CategoryManager categories={categories} onSave={handleSaveCategory} onDelete={handleDeleteCategory} />
          </div>
        )
      case 'scheduled':
        return (
          <div>
            <button onClick={goBack} className="text-sm text-accent mb-4 flex items-center gap-1">
              ← Indietro
            </button>
            <ScheduledManager
              scheduled={scheduled}
              onSave={handleSaveScheduled}
              onToggle={handleToggleScheduled}
              onDelete={handleDeleteScheduled}
            />
          </div>
        )
      case 'family':
        return (
          <div>
            <button onClick={goBack} className="text-sm text-accent mb-4 flex items-center gap-1">
              ← Indietro
            </button>
            <FamilyManager
              family={family}
              members={members}
              onCreate={handleCreateFamily}
              onInvite={handleInviteMember}
              onRemoveMember={(id) => setMembers(prev => prev.filter(m => m.profile_id !== id))}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-text-primary">
            {section === 'menu' ? 'Impostazioni' : ''}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {section === 'menu' ? (
          <div className="space-y-1">
            {/* Profile */}
            <div className="flex items-center gap-4 p-4 bg-surface rounded-2xl border border-border mb-6">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <User size={26} className="text-accent" />
                </div>
                <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px]">
                  <Camera size={11} />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {user?.user_metadata?.full_name || 'Utente'}
                </p>
                <p className="text-xs text-text-secondary">{user?.email || ''}</p>
              </div>
              <ChevronRight size={16} className="text-text-secondary" />
            </div>

            <SettingsRow
              icon={Tag} label="Categorie" subtitle="Gestisci categorie di spesa e entrata"
              badge={`${categories.length}`} onClick={() => setSection('categories')}
            />
            <SettingsRow
              icon={Clock} label="Transazioni programmate" subtitle="Spese ed entrate ricorrenti"
              badge={`${scheduled.length}`} onClick={() => setSection('scheduled')}
            />
            <SettingsRow
              icon={Users} label="Famiglia" subtitle={family ? family.name : 'Gestisci gruppo familiare'}
              onClick={() => setSection('family')}
            />

            {/* Logout */}
            <div className="pt-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-expense hover:bg-expense/5 rounded-xl transition-colors"
              >
                <LogOut size={16} /> Esci
              </button>
              <p className="text-[10px] text-text-tertiary text-center mt-4">
                LokiSpesi v0.2.0 — PWA
              </p>
            </div>
          </div>
        ) : (
          renderSection()
        )}
      </div>
    </div>
  )
}

function SettingsRow({
  icon: Icon, label, subtitle, badge, onClick,
}: {
  icon: typeof User; label: string; subtitle: string; badge?: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface transition-colors text-left border-b border-border/50">
      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary truncate">{subtitle}</p>
      </div>
      {badge && (
        <span className="text-xs text-text-secondary bg-primary/50 px-2 py-0.5 rounded-full">{badge}</span>
      )}
      <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
    </button>
  )
}
