import { supabase } from '@/lib/supabase'

/**
 * Generates the next agreement number in DOK-YYYY-NNNN format.
 * Queries the current year's max sequence number and increments it.
 */
export async function generateAgreementNumber() {
  const year = new Date().getFullYear()
  const prefix = `DOK-${year}-`

  const { data, error } = await supabase
    .from('rentals')
    .select('agreement_no')
    .like('agreement_no', `${prefix}%`)
    .order('agreement_no', { ascending: false })
    .limit(1)

  if (error) throw new Error(error.message)

  let next = 1
  if (data && data.length > 0) {
    const last = data[0].agreement_no
    const seq = parseInt(last.replace(prefix, ''), 10)
    if (!isNaN(seq)) next = seq + 1
  }

  return `${prefix}${String(next).padStart(4, '0')}`
}
