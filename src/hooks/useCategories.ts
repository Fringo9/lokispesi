import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { localDB } from '@/db/database'
import { syncManager } from '@/sync/SyncManager'
import type { Category, CategoryFilter } from '@/types'

const CATEGORIES_KEY = 'categories'

const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Stipendio', icon: 'briefcase', color: '#22C55E', type: 'income' as const },
    { name: 'Freelance', icon: 'laptop', color: '#16A34A', type: 'income' as const },
    { name: 'Altro (entrate)', icon: 'ellipsis', color: '#6B7280', type: 'income' as const },
  ],
  expense: [
    { name: 'Affitto/Mutuo', icon: 'home', color: '#EF4444', type: 'expense' as const },
    { name: 'Bollette', icon: 'zap', color: '#F97316', type: 'expense' as const },
    { name: 'Spesa alimentare', icon: 'shopping-cart', color: '#EAB308', type: 'expense' as const },
    { name: 'Trasporti', icon: 'car', color: '#3B82F6', type: 'expense' as const },
    { name: 'Ristoranti', icon: 'utensils-crossed', color: '#EC4899', type: 'expense' as const },
    { name: 'Salute', icon: 'heart-pulse', color: '#14B8A6', type: 'expense' as const },
    { name: 'Intrattenimento', icon: 'tv', color: '#8B5CF6', type: 'expense' as const },
    { name: 'Abbigliamento', icon: 'shirt', color: '#F43F5E', type: 'expense' as const },
    { name: 'Investimenti', icon: 'trending-up', color: '#06B6D4', type: 'both' as const },
    { name: 'Altro', icon: 'ellipsis', color: '#6B7280', type: 'both' as const },
  ],
}

export function useCategories() {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.user ?? null
    },
    staleTime: Infinity,
  })

  const userId = user?.id

  const query = useQuery({
    queryKey: [CATEGORIES_KEY, userId],
    queryFn: async (): Promise<Category[]> => {
      if (!userId) return []

      // Try local first
      const local = await localDB.getCategories(userId)
      if (local.length > 0) return local

      // Fetch from server
      if (navigator.onLine) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })

        if (data && data.length > 0) {
          await localDB.upsertCategories(data as Category[])
          return data as Category[]
        }
      }

      // Seed defaults if no categories exist
      return seedDefaultCategories(userId)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  })

  const createMutation = useMutation({
    mutationFn: async (cat: { name: string; icon: string; color: string; type: CategoryFilter }) => {
      const newCat: Partial<Category> = {
        id: crypto.randomUUID(),
        user_id: userId!,
        ...cat,
        is_default: false,
        created_at: new Date().toISOString(),
      }

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('categories')
          .insert(newCat)
          .select()
          .single()
        if (!error && data) return data as Category
      }

      await syncManager.enqueueMutation('create', 'categories', newCat as Record<string, unknown>)
      await localDB.categories.put(newCat as Category)
      return newCat as Category
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] }),
  })

  return {
    categories: query.data ?? [],
    incomeCategories: (query.data ?? []).filter(c => c.type === 'income' || c.type === 'both'),
    expenseCategories: (query.data ?? []).filter(c => c.type === 'expense' || c.type === 'both'),
    isLoading: query.isLoading,
    createCategory: createMutation.mutate,
  }
}

async function seedDefaultCategories(userId: string): Promise<Category[]> {
  const allDefaults = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense]
  const categories: Category[] = allDefaults.map((cat) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    type: cat.type,
    is_default: true,
    created_at: new Date().toISOString(),
  }))

  // Save locally
  await localDB.upsertCategories(categories)

  // Save to server
  if (navigator.onLine) {
    await supabase.from('categories').upsert(
      categories.map(c => ({ ...c, id: undefined }))
    )
  }

  return categories
}
