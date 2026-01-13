/**
 * Client-side utility to clean up invite data from sessionStorage
 * Should be called after successful invite acceptance
 */
export function cleanupInviteData() {
  if (typeof window !== 'undefined') {
    try {
      // Clean up new sessionStorage key
      sessionStorage.removeItem('invite_fullname')
      // Also clean up legacy localStorage key (migration)
      localStorage.removeItem('invite_data')
    } catch (error) {
      console.error('Failed to cleanup invite data:', error)
    }
  }
}

