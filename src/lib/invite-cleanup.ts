/**
 * Client-side utility to clean up invite data from localStorage
 * Should be called after successful invite acceptance
 */
export function cleanupInviteData() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('invite_data')
    } catch (error) {
      console.error('Failed to cleanup invite data:', error)
    }
  }
}

