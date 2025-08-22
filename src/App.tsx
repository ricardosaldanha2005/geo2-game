import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTrace } from '@/hooks/useTrace'
import { useMobile } from '@/hooks/useMobile'
import { Login } from '@/pages/Login'
import { MapView } from '@/components/MapView'
import { Controls } from '@/components/Controls'
import { Leaderboard } from '@/pages/Leaderboard'
import Admin from '@/pages/Admin'
import { Hud } from '@/components/Hud'
import { MobileHud } from '@/components/MobileHud'
import { MobileControls } from '@/components/MobileControls'
import { RealtimeProvider } from '@/context/RealtimeContext'
import { safeStorage } from '@/lib/storage'


import './styles/index.css'
import { useEffect } from 'react'

function GameLayout() {
  const { user, loading } = useAuth()
  const { isMobile } = useMobile()
  
  // Adicionar sistema de traços
  useTrace()
  
  // Ativar modo live por defeito
  useEffect(() => {
    const hasMode = safeStorage.getItem('gameMode')
    if (!hasMode) {
      safeStorage.setItem('gameMode', 'live')
    }
  }, [])

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  // Se não há usuário, redirecionar para login (mesmo em modo offline)
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="game-layout">
      <div className="map-container">
        <MapView />
      </div>
      <div className="ui-overlay">
        <div className="top-left">
          {isMobile ? <MobileControls /> : <Controls />}
        </div>
        <div className="top-right">
          {isMobile ? <MobileHud /> : <Hud />}
        </div>
        <div className="bottom-center">
          <div className="navigation">
            <a href="/leaderboard" className="nav-button">
              🏆 Leaderboard
            </a>
            <a href="/admin" className="nav-button">
              🛠️ Admin
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  // Listener para logout
  useEffect(() => {
    const handleLogout = () => {
      // Forçar redirecionamento para login
      window.location.href = '/login'
    }

    window.addEventListener('user-logged-out', handleLogout)
    return () => window.removeEventListener('user-logged-out', handleLogout)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <RealtimeProvider>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={<GameLayout />} />
          </Routes>
        </RealtimeProvider>
      </div>
    </Router>
  )
}

export default App


