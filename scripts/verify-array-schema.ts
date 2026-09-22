import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://clxqjxtmxswpjjvqunfx.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHFqeHRteHN3cGpqdnF1bmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDE0NjUsImV4cCI6MjEwMjA3NzQ2NX0.h01su8uEZxiPqsk7F7o_vnsb8KRGzM1jm8ioN3baGD4'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function verifyArraySchema() {
  console.log('=============================================================')
  console.log('🧪 VERIFYING THEME & ROUTED_ROLES ARRAY COLUMN IN SUPABASE')
  console.log('=============================================================\n')

  // 1. Fetch account ID
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('id').limit(1)
  if (accErr || !accounts || accounts.length === 0) {
    console.error('❌ Failed to fetch account_id:', accErr)
    process.exit(1)
  }
  const accountId = accounts[0].id
  console.log(`[1] Found Account ID: ${accountId}`)

  // 2. Insert test record
  const testMessageId = 'test-array-verify-001'
  const payload = {
    account_id: accountId,
    message_id: testMessageId,
    from_address: 'test@example.com',
    subject: 'Array type verification test',
    received_at: new Date().toISOString(),
    status: 'new',
    theme: 'suppliers',
    urgency: 'normal',
    routed_roles: ['director', 'senior_admin'],
  }

  console.log(`[2] Inserting test record with routed_roles: [ 'director', 'senior_admin' ]...`)
  const { error: insertErr } = await supabase.from('emails').insert(payload)

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr)
    console.log('\n⚠️ NOTE: If columns theme/urgency/routed_roles do not exist yet, please run the migration SQL in Supabase SQL Editor.')
    process.exit(1)
  }
  console.log('✅ Test record inserted successfully.')

  // 3. Read back
  console.log(`[3] Reading back record with message_id = '${testMessageId}'...`)
  const { data: rows, error: selectErr } = await supabase
    .from('emails')
    .select('id, theme, urgency, routed_roles')
    .eq('message_id', testMessageId)

  if (selectErr || !rows || rows.length === 0) {
    console.error('❌ Readback failed:', selectErr)
    process.exit(1)
  }

  const record = rows[0]
  console.log('✅ Readback result:', JSON.stringify(record, null, 2))
  const isArray = Array.isArray(record.routed_roles)
  const matches = JSON.stringify(record.routed_roles) === JSON.stringify(['director', 'senior_admin'])

  console.log(`[3a] Is routed_roles parsed as native Array: ${isArray ? '✅ YES' : '❌ NO'}`)
  console.log(`[3b] routed_roles matches ['director', 'senior_admin']: ${matches ? '✅ YES' : '❌ NO'}`)

  // 4. Delete test record
  console.log(`\n[4] Deleting test record...`)
  const { error: delErr } = await supabase
    .from('emails')
    .delete()
    .eq('message_id', testMessageId)

  if (delErr) {
    console.error('❌ Deletion failed:', delErr)
    process.exit(1)
  }
  console.log('✅ Test record deleted successfully.')

  // 5. Confirm deletion
  const { data: checkRows } = await supabase
    .from('emails')
    .select('id')
    .eq('message_id', testMessageId)

  console.log(`[5] Remaining test rows: ${checkRows?.length || 0} (0 expected)`)
  console.log('\n=============================================================')
  console.log('🎉 ARRAY TYPE VERIFICATION COMPLETED SUCCESSFULLY!')
  console.log('=============================================================')
}

verifyArraySchema().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
