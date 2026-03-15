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

export default function App() {
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
        </Route>
      </Route>
    </Routes>
  )
}
