import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useCouriers() {
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCouriers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [{ data: couriersData, error: couriersError }, { data: activeRentals }] =
      await Promise.all([
        supabase.from('couriers').select('*').order('created_at', { ascending: false }),
        supabase.from('rentals').select('courier_id').eq('status', 'active'),
      ])

    if (couriersError) {
      setError(couriersError.message)
      setLoading(false)
      return
    }

    const countMap = {}
    activeRentals?.forEach((r) => {
      countMap[r.courier_id] = (countMap[r.courier_id] || 0) + 1
    })

    setCouriers(
      (couriersData || []).map((c) => ({ ...c, active_rentals: countMap[c.id] || 0 })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCouriers()
  }, [fetchCouriers])

  async function addCourier(values) {
    const { error } = await supabase.from('couriers').insert(values)
    if (error) throw new Error(error.message)
    await fetchCouriers()
  }

  async function updateCourier(id, values) {
    const { error } = await supabase.from('couriers').update(values).eq('id', id)
    if (error) throw new Error(error.message)
    await fetchCouriers()
  }

  return { couriers, loading, error, addCourier, updateCourier, refetch: fetchCouriers }
}
