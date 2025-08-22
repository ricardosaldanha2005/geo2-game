import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Logout() {
  const { signOut } = useAuth()

  useEffect(() => {
    signOut().catch(() => {
      // Em último caso, força redirecionamento
      window.dispatchEvent(new CustomEvent('user-logged-out'))
    })
  }, [signOut])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">A terminar sessão...</div>
    </div>
  )
}


