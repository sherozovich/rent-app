import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import { loadTariffRates } from '@/lib/tariffRates'
import { Loader2 } from 'lucide-react'

const Dashboard   = lazy(() => import('@/pages/Dashboard'))
const Couriers    = lazy(() => import('@/pages/Couriers'))
const Scooters    = lazy(() => import('@/pages/Scooters'))
const Rentals     = lazy(() => import('@/pages/Rentals'))
const NewRental   = lazy(() => import('@/pages/NewRental'))
const RentalDetail = lazy(() => import('@/pages/RentalDetail'))
const Settings    = lazy(() => import('@/pages/Settings'))
const Expenses    = lazy(() => import('@/pages/Expenses'))

function PageLoader() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-12 px-6">
      <Loader2 size={16} className="animate-spin" />
      Загрузка...
    </div>
  )
}

export default function App() {
  useEffect(() => {
    loadTariffRates()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="couriers" element={<Suspense fallback={<PageLoader />}><Couriers /></Suspense>} />
          <Route path="scooters" element={<Suspense fallback={<PageLoader />}><Scooters /></Suspense>} />
          <Route path="rentals" element={<Suspense fallback={<PageLoader />}><Rentals /></Suspense>} />
          <Route path="rentals/new" element={<Suspense fallback={<PageLoader />}><NewRental /></Suspense>} />
          <Route path="rentals/:id" element={<Suspense fallback={<PageLoader />}><RentalDetail /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="expenses" element={<Suspense fallback={<PageLoader />}><Expenses /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  )
}
