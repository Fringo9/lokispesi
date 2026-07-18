import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { PageSkeleton } from '@/components/ui/Skeleton'
import AppLayout from '@/layouts/AppLayout'

// Lazy load pages for code splitting
const Diary = lazy(() => import('@/pages/Diary'))
const Wallet = lazy(() => import('@/pages/Wallet'))
const Accounts = lazy(() => import('@/pages/Accounts'))
const Overview = lazy(() => import('@/pages/Overview'))
const Settings = lazy(() => import('@/pages/Settings'))

function PageFallback() {
  return <PageSkeleton />
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/app/diary" replace />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="diary" replace />} />
            <Route path="diary" element={<Diary />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="overview" element={<Overview />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
