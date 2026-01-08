'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

/**
 * Global auth state watcher
 * Listens for session expiry and redirects to login
 */
export default function AuthWatcher() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          toast.error('Din sesjon er utløpt. Vennligst logg inn på nytt.')
          router.push('/login')
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully')
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  return null // This component doesn't render anything
}
