import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isIPhone, setIsIPhone] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /mobile|android|iphone|ipad|phone/i.test(userAgent)
      const isIPhoneDevice = /iphone|ipad|ipod/i.test(userAgent)
      
      setIsMobile(isMobileDevice)
      setIsIPhone(isIPhoneDevice)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return { isMobile, isIPhone }
}
