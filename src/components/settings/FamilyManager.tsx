import { useState } from 'react'
import { X, Plus, Users, UserPlus, Crown, User, Mail, Copy, Check } from 'lucide-react'
import type { FamilyGroup, FamilyMember } from '@/types'

interface Props {
  family: FamilyGroup | null
  members: FamilyMember[]
  onCreate: (name: string) => void
  onInvite: (email: string) => void
  onRemoveMember: (profileId: string) => void
}

export default function FamilyManager({ family, members, onCreate, onInvite, onRemoveMember }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteLink = family ? `https://lokispesi.app/join?family=${family.id}` : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCreate = () => {
    if (!familyName.trim()) return
    onCreate(familyName.trim())
    setShowCreate(false)
    setFamilyName('')
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    onInvite(inviteEmail.trim())
    setShowInvite(false)
    setInviteEmail('')
  }

  if (!family) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Famiglia</h2>
        </div>
        <div className="text-center py-10 bg-surface rounded-xl border border-border">
          <Users size={36} className="text-text-secondary mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Condivisione familiare</h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed mb-4">
            Crea un gruppo famiglia per condividere spese ed entrate con i tuoi familiari in tempo reale.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} /> Crea gruppo famiglia
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-text-primary">Nuovo gruppo famiglia</h2>
                <button onClick={() => setShowCreate(false)} className="text-text-secondary"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Nome del gruppo</label>
                  <input type="text" value={familyName} onChange={e => setFamilyName(e.target.value)}
                    placeholder="es. Famiglia Rossi" autoFocus
                    className="w-full bg-primary/50 rounded-xl px-4 py-3 border border-border text-sm text-text-primary outline-none focus:border-accent/30" />
                </div>
                <button onClick={handleCreate} disabled={!familyName.trim()}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    familyName.trim() ? 'bg-accent text-white hover:bg-blue-600' : 'bg-border text-text-secondary cursor-not-allowed'
                  }`}>
                  Crea gruppo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Famiglia</h2>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-blue-400">
          <UserPlus size={14} /> Invita
        </button>
      </div>

      {/* Family info */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users size={22} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{family.name}</p>
            <p className="text-xs text-text-secondary">{members.length} membro{members.length !== 1 ? 'i' : ''}</p>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-1.5">
          {members.map(m => (
            <div key={m.profile_id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center">
                <User size={14} className="text-text-secondary" />
              </div>
              <span className="text-sm text-text-primary flex-1">Membro</span>
              {m.role === 'admin' ? (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  <Crown size={10} /> Admin
                </span>
              ) : (
                <button onClick={() => onRemoveMember(m.profile_id)}
                  className="text-[10px] text-text-secondary hover:text-expense px-2 py-0.5 transition-colors">
                  Rimuovi
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite link */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-text-secondary mb-2">Link di invito</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-primary/50 rounded-lg px-3 py-2 text-text-secondary truncate">
              {inviteLink}
            </code>
            <button onClick={handleCopyLink}
              className="flex-shrink-0 px-3 py-2 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors flex items-center gap-1">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiato' : 'Copia'}
            </button>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-border border-b-0 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text-primary">Invita membro</h2>
              <button onClick={() => setShowInvite(false)} className="text-text-secondary"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 block">Email</label>
                <div className="flex items-center gap-2 bg-primary/50 rounded-xl px-4 py-3 border border-border">
                  <Mail size={16} className="text-text-secondary" />
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@esempio.com" autoFocus
                    className="flex-1 bg-transparent text-sm text-text-primary outline-none" />
                </div>
              </div>
              <button onClick={handleInvite} disabled={!inviteEmail.trim()}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                  inviteEmail.trim() ? 'bg-accent text-white hover:bg-blue-600' : 'bg-border text-text-secondary cursor-not-allowed'
                }`}>
                Invia invito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
