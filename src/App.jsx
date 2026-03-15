import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Couriers from '@/pages/Couriers'
import Scooters from '@/pages/Scooters'
import Rentals from '@/pages/Rentals'
import NewRental from '@/pages/NewRental'
import RentalDetail from '@/pages/RentalDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="couriers" element={<Couriers />} />
        <Route path="scooters" element={<Scooters />} />
        <Route path="rentals" element={<Rentals />} />
        <Route path="rentals/new" element={<NewRental />} />
        <Route path="rentals/:id" element={<RentalDetail />} />
      </Route>
    </Routes>
  )
}
