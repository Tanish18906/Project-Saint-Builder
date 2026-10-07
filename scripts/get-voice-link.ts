import { generateVoiceToken } from '../src/lib/voice-token'
import { createClient } from '@supabase/supabase-js'

async function run() {
  let emailId = process.argv[2]
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!emailId) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://clxqjxtmxswpjjvqunfx.supabase.co'
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHFqeHRteHN3cGpqdnF1bmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDE0NjUsImV4cCI6MjEwMjA3NzQ2NX0.h01su8uEZxiPqsk7F7o_vnsb8KRGzM1jm8ioN3baGD4'

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: latestEmail } = await supabase
        .from('emails')
        .select('id, subject, theme')
        .order('received_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestEmail) {
        emailId = latestEmail.id
        console.log(`Using latest email from DB: "${latestEmail.subject}" (${latestEmail.id})`)
      }
    } catch {
      // fallback to placeholder
    }

    if (!emailId) {
      emailId = '3f656ba4-1caf-4211-ac8a-af1bb3ced59b'
    }
  }

  const token = generateVoiceToken(emailId, 24)
  const url = `${baseUrl.replace(/\/$/, '')}/voice/${token}`

  console.log('--------------------------------------------------')
  console.log('🎙️  FOREMAN VOICE REVIEW LINK GENERATED')
  console.log('--------------------------------------------------')
  console.log(`Email ID: ${emailId}`)
  console.log(`Token:    ${token}`)
  console.log(`\n🔗 Test URL:\n${url}\n`)
  console.log('--------------------------------------------------')
}

run()
