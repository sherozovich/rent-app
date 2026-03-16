import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useRentals(filters = {}) {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRentals = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('rentals')
      .select(`
        *,
        courier:couriers(id, full_name, phone),
        scooter:scooters(id, model, plate, vin)
      `)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setRentals(data || [])
    }
    setLoading(false)
  }, [filters.status])

  useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  async function deleteRental(id) {
    // Update to cancelled first so the trigger sets scooter back to available
    await supabase.from('rentals').update({ status: 'cancelled' }).eq('id', id)
    // Delete related payments
    await supabase.from('payments').delete().eq('rental_id', id)
    const { error } = await supabase.from('rentals').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchRentals()
  }

  return { rentals, loading, error, deleteRental, refetch: fetchRentals }
}

export function useRental(id) {
  const [rental, setRental] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRental = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    const [{ data: rentalData, error: rentalError }, { data: paymentData }] = await Promise.all([
      supabase
        .from('rentals')
        .select(`
          *,
          courier:couriers(id, full_name, passport_no, phone),
          scooter:scooters(id, model, plate, vin)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('payments')
        .select('*')
        .eq('rental_id', id)
        .order('paid_at', { ascending: false }),
    ])

    if (rentalError) {
      setError(rentalError.message)
    } else {
      setRental(rentalData)
      setPayments(paymentData || [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchRental()
  }, [fetchRental])

  async function addPayment(values) {
    const { error } = await supabase
      .from('payments')
      .insert({ ...values, rental_id: id })
    if (error) throw new Error(error.message)
    await fetchRental()
  }

  async function updateRentalStatus(status) {
    const { error } = await supabase
      .from('rentals')
      .update({ status })
      .eq('id', id)
    if (error) throw new Error(error.message)
    await fetchRental()
  }

  async function updatePhotos(photos) {
    const { error } = await supabase
      .from('rentals')
      .update({ photos })
      .eq('id', id)
    if (error) throw new Error(error.message)
    await fetchRental()
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    rental,
    payments,
    loading,
    error,
    totalPaid,
    addPayment,
    updateRentalStatus,
    updatePhotos,
    refetch: fetchRental,
  }
}
