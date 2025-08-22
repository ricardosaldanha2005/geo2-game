import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isIPhone, setIsIPhone] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const uaRaw = navigator.userAgent || (navigator as any).vendor || ''
      const ua = uaRaw.toLowerCase()

      // iPadOS 13+ can present a desktop UA (Mac) but with touch points
      const isIpadOsDesktopUa = /macintosh|mac os x/i.test(uaRaw) && (navigator as any).maxTouchPoints > 1

      const isMobileUserAgent = /android|iphone|ipad|ipod|iemobile|blackberry|webos|opera mini|mobile/i.test(ua) || isIpadOsDesktopUa
      const isSmallScreen = typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia('(max-width: 768px)').matches : false

      // Treat as mobile if UA says so or if viewport is small
      setIsMobile(Boolean(isMobileUserAgent || isSmallScreen))

      // iPhone detection (iPad excluded)
      const iPhoneUa = /iphone|ipod/i.test(ua)
      setIsIPhone(Boolean(iPhoneUa))
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice as any)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice as any)
    }
  }, [])

  return { isMobile, isIPhone }
}
