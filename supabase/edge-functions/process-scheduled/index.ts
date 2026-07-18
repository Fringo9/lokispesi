// Edge Function: process-scheduled
// Cron job to process recurring scheduled transactions
// Called daily by pg_cron or external scheduler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { addDays, addWeeks, addMonths, addYears, format } from 'https://esm.sh/date-fns@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const today = format(new Date(), 'yyyy-MM-dd')

    // Fetch all scheduled transactions due today or earlier
    const { data: scheduled, error: fetchError } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('is_active', true)
      .lte('next_occurrence', today)

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    if (!scheduled || scheduled.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No due transactions' }))
    }

    const processed: string[] = []
    const errors: string[] = []

    for (const sched of scheduled) {
      try {
        // Check if already processed today (safety check)
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('recurring_id', sched.id)
          .eq('transaction_date', today)
          .maybeSingle()

        if (existing) {
          // Already created today, just update next_occurrence
          const nextDate = calculateNext(sched.next_occurrence, sched.frequency, sched.interval_value)
          await supabase
            .from('scheduled_transactions')
            .update({ next_occurrence: nextDate, last_processed_at: new Date().toISOString() })
            .eq('id', sched.id)
          continue
        }

        // Check end_date
        if (sched.end_date && sched.next_occurrence > sched.end_date) {
          await supabase
            .from('scheduled_transactions')
            .update({ is_active: false })
            .eq('id', sched.id)
          continue
        }

        // Create the transaction
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: sched.user_id,
            family_id: sched.family_id,
            category_id: sched.category_id,
            type: sched.type,
            amount: sched.amount,
            description: sched.description,
            note: sched.note,
            transaction_date: today,
            is_recurring: true,
            recurring_id: sched.id,
          })

        if (insertError) {
          errors.push(`${sched.description}: ${insertError.message}`)
          continue
        }

        // Calculate next occurrence
        const nextDate = calculateNext(sched.next_occurrence, sched.frequency, sched.interval_value)

        // Update schedule
        await supabase
          .from('scheduled_transactions')
          .update({
            next_occurrence: nextDate,
            last_processed_at: new Date().toISOString(),
          })
          .eq('id', sched.id)

        processed.push(sched.id)
      } catch (err) {
        errors.push(`${sched.description}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return new Response(
      JSON.stringify({
        processed: processed.length,
        scheduled_ids: processed,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${processed.length} scheduled transactions`,
      })
    )
  } catch (err) {
    console.error('process-scheduled error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500 }
    )
  }
})

function calculateNext(
  currentDate: string,
  frequency: string,
  interval: number
): string {
  const date = new Date(currentDate + 'T00:00:00')
  let next: Date

  switch (frequency) {
    case 'daily':
      next = addDays(date, interval)
      break
    case 'weekly':
      next = addWeeks(date, interval)
      break
    case 'monthly':
      next = addMonths(date, interval)
      break
    case 'yearly':
      next = addYears(date, interval)
      break
    default:
      next = addMonths(date, 1)
  }

  return format(next, 'yyyy-MM-dd')
}
