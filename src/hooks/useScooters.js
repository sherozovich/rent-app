import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useScooters() {
  const [scooters, setScooters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchScooters = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('scooters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setScooters(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchScooters()
  }, [fetchScooters])

  async function addScooter(values) {
    const { error } = await supabase.from('scooters').insert(values)
    if (error) throw new Error(error.message)
    await fetchScooters()
  }

  async function updateScooter(id, values) {
    const { error } = await supabase.from('scooters').update(values).eq('id', id)
    if (error) throw new Error(error.message)
    await fetchScooters()
  }

  return { scooters, loading, error, addScooter, updateScooter, refetch: fetchScooters }
}
