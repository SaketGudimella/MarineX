import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LoginPage from '@/components/LoginPage'

export default async function PrivatePage() {
  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (data?.user) {
    redirect('/dashboard')
  }

  return <LoginPage />
}