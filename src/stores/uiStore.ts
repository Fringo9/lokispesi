import { create } from 'zustand'

export type ModalType = 'addExpense' | 'editExpense' | 'search' | 'connectBank' | 'addCategory' | 'addScheduled' | null
export type ActiveTab = 0 | 1 | 2 | 3 | 4

interface UIState {
  activeTab: ActiveTab
  activeModal: ModalType
  selectedExpenseId: string | null
  theme: 'dark' | 'light'

  setActiveTab: (tab: ActiveTab) => void
  openModal: (modal: ModalType, expenseId?: string) => void
  closeModal: () => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 0,
  activeModal: null,
  selectedExpenseId: null,
  theme: 'dark',

  setActiveTab: (tab) => set({ activeTab: tab }),
  openModal: (modal, expenseId) =>
    set({ activeModal: modal, selectedExpenseId: expenseId ?? null }),
  closeModal: () => set({ activeModal: null, selectedExpenseId: null }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}))
