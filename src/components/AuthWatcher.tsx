'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

/**
 * Global auth state watcher
 * Listens for session expiry and redirects to login
 * Does NOT show error for intentional logout (handled by logout button)
 */
export default function AuthWatcher() {
  const router = useRouter()
  const supabase = createClient()
  // Track if user initiated logout intentionally
  const isIntentionalLogout = useRef(false)

  useEffect(() => {
    // Listen for intentional logout signal
    const handleIntentionalLogout = () => {
      isIntentionalLogout.current = true
    }
    window.addEventListener('intentional-logout', handleIntentionalLogout)

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        void _session
        if (event === 'SIGNED_OUT') {
          // Only show error if this was NOT an intentional logout
          if (!isIntentionalLogout.current) {
            toast.error('Din sesjon er utløpt. Vennligst logg inn på nytt.')
          }
          // Reset flag and redirect
          isIntentionalLogout.current = false
          router.push('/login')
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
      window.removeEventListener('intentional-logout', handleIntentionalLogout)
    }
  }, [router, supabase])

  return null // This component doesn't render anything
}
