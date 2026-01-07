// Media query utilities for responsive design
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
}

export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < breakpoints.mobile
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= breakpoints.mobile && window.innerWidth < breakpoints.tablet
}

// Responsive grid columns helper
export const getGridColumns = (desktop: number, tablet: number = 2, mobile: number = 1) => {
  if (typeof window === 'undefined') return desktop

  if (window.innerWidth < breakpoints.mobile) return mobile
  if (window.innerWidth < breakpoints.tablet) return tablet
  return desktop
}
