import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { LogIn, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'signup'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || email.split('@')[0] },
          },
        })

        if (signUpError) throw signUpError

        if (data?.user) {
          // Profile is auto-created by the handle_new_user trigger
          // Seed default categories for the new user
          await seedDefaultCategories(data.user.id)
          navigate('/app/diary', { replace: true })
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        navigate('/app/diary', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'

      // Translate common Supabase errors
      if (message.includes('Invalid login credentials')) {
        setError('Email o password errati')
      } else if (message.includes('already registered')) {
        setError('Questa email è già registrata. Prova ad accedere.')
      } else if (message.includes('Password')) {
        setError('La password deve essere di almeno 6 caratteri')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-primary p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-extrabold text-accent">LS</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">LokiSpesi</h1>
          <p className="text-sm text-text-secondary mt-1">
            Tracciamento spese personale
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-surface rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LogIn size={14} />
            Accedi
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <UserPlus size={14} />
            Registrati
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Il tuo nome"
                className="w-full bg-surface rounded-xl px-4 py-3 border border-border text-sm text-text-primary
                           placeholder:text-text-secondary outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nome@email.com"
              required
              autoComplete="email"
              className="w-full bg-surface rounded-xl px-4 py-3 border border-border text-sm text-text-primary
                         placeholder:text-text-secondary outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full bg-surface rounded-xl px-4 py-3 pr-11 border border-border text-sm text-text-primary
                           placeholder:text-text-secondary outline-none focus:border-accent/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-expense/10 border border-expense/20 rounded-xl px-4 py-3">
              <p className="text-xs text-expense">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
              loading || !email || !password
                ? 'bg-border text-text-secondary cursor-not-allowed'
                : 'bg-accent text-white hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-accent/25'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="25" opacity="0.5"/>
                </svg>
                {mode === 'signup' ? 'Registrazione...' : 'Accesso...'}
              </span>
            ) : (
              <>
                {mode === 'signup' ? 'Crea account' : 'Accedi'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-6">
          {mode === 'login' ? (
            <>Non hai un account?{' '}
              <button onClick={() => setMode('signup')} className="text-accent hover:text-accent-bright font-medium">
                Registrati
              </button>
            </>
          ) : (
            <>Hai già un account?{' '}
              <button onClick={() => setMode('login')} className="text-accent hover:text-accent-bright font-medium">
                Accedi
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

async function seedDefaultCategories(userId: string) {
  const categories = [
    { name: 'Stipendio', icon: 'briefcase', color: '#22C55E', type: 'income' },
    { name: 'Freelance', icon: 'laptop', color: '#16A34A', type: 'income' },
    { name: 'Altro (entrate)', icon: 'ellipsis', color: '#6B7280', type: 'income' },
    { name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444', type: 'expense' },
    { name: 'Bollette', icon: 'zap', color: '#F97316', type: 'expense' },
    { name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308', type: 'expense' },
    { name: 'Trasporti', icon: 'car', color: '#3B82F6', type: 'expense' },
    { name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899', type: 'expense' },
    { name: 'Salute', icon: 'heart-pulse', color: '#14B8A6', type: 'expense' },
    { name: 'Intrattenimento', icon: 'tv', color: '#8B5CF6', type: 'expense' },
    { name: 'Abbigliamento', icon: 'shirt', color: '#F43F5E', type: 'expense' },
    { name: 'Investimenti', icon: 'trending-up', color: '#06B6D4', type: 'both' },
    { name: 'Altro', icon: 'ellipsis', color: '#6B7280', type: 'both' },
  ]

  const { error } = await supabase.from('categories').insert(
    categories.map(cat => ({
      user_id: userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      is_default: true,
    }))
  )

  if (error) {
    console.warn('Failed to seed categories:', error.message)
  }
}
