import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Couriers from '@/pages/Couriers'
import Scooters from '@/pages/Scooters'
import Rentals from '@/pages/Rentals'
import NewRental from '@/pages/NewRental'
import RentalDetail from '@/pages/RentalDetail'
import Settings from '@/pages/Settings'
import Expenses from '@/pages/Expenses'
import { loadTariffRates } from '@/lib/tariffRates'

export default function App() {
  useEffect(() => {
    loadTariffRates()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="couriers" element={<Couriers />} />
          <Route path="scooters" element={<Scooters />} />
          <Route path="rentals" element={<Rentals />} />
          <Route path="rentals/new" element={<NewRental />} />
          <Route path="rentals/:id" element={<RentalDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="expenses" element={<Expenses />} />
        </Route>
      </Route>
    </Routes>
  )
}
