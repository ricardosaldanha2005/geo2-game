import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTrace } from '@/hooks/useTrace'
import { Login } from '@/pages/Login'
import { MapView } from '@/components/MapView'
import { Controls } from '@/components/Controls'
import { Leaderboard } from '@/pages/Leaderboard'
import { Hud } from '@/components/Hud'

import './styles/index.css'
import { useEffect } from 'react'

function GameLayout() {
  const { user, loading } = useAuth()
  
  // Adicionar sistema de traços
  useTrace()
  
  // Ativar modo mock para controles funcionarem
  useEffect(() => {
    if (!localStorage.getItem('gameMode')) {
      localStorage.setItem('gameMode', 'mock')
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
          <Controls />
        </div>
        <div className="top-right">
          <Hud />
        </div>
        <div className="bottom-center">
          <div className="navigation">
            <a href="/leaderboard" className="nav-button">
              🏆 Leaderboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  // Verificar se as variáveis de ambiente estão configuradas
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // Se não estiver configurado, funcionar em modo offline

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
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/" element={<GameLayout />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App


