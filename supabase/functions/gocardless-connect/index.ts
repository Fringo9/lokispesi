// Edge Function: gocardless-connect
// Creates a GoCardless EUA + Requisition and returns the authorization link
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { GoCardlessClient } from '../_shared/gocardless.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GC_SECRET_ID = Deno.env.get('GOCARDLESS_SECRET_ID')!
const GC_SECRET_KEY = Deno.env.get('GOCARDLESS_SECRET_KEY')!

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const gc = new GoCardlessClient(GC_SECRET_ID, GC_SECRET_KEY)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request
    const { institution_id } = await req.json()

    if (!institution_id) {
      return new Response(JSON.stringify({ error: 'institution_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create EUA (End User Agreement)
    const agreement = await gc.createAgreement(institution_id, 180, 90)

    // Generate a unique reference
    const reference = `${user.id}-${Date.now()}`

    // Determine the redirect URL for the callback
    const appUrl = req.headers.get('origin') || Deno.env.get('APP_URL') || 'http://localhost:5173'
    const redirectUrl = `${appUrl}/app/accounts/callback`

    // Create Requisition
    const requisition = await gc.createRequisition(
      institution_id,
      redirectUrl,
      reference,
      agreement.id
    )

    // Store connection in database (pending)
    const { error: dbError } = await supabase
      .from('bank_connections')
      .insert({
        user_id: user.id,
        institution_name: institution_id, // Will be updated when we fetch details
        institution_id,
        requisition_id: requisition.id,
        is_active: true,
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
    }

    return new Response(
      JSON.stringify({
        link: requisition.link,
        requisition_id: requisition.id,
        agreement_id: agreement.id,
        reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('gocardless-connect error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
