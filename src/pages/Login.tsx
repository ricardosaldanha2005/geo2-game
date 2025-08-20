import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function Login() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [team, setTeam] = useState<'green' | 'blue' | 'red'>('green')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error, message } = await signUp(email, password, name, team)
        if (error) throw error
        if (message) {
          setError(message) // Usar setError para mostrar a mensagem informativa
          // Limpar os campos após registro bem-sucedido
          setEmail('')
          setPassword('')
          setName('')
          setTeam('green')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isSignUp ? 'Criar Conta' : 'Entrar no Jogo Geo'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {isSignUp ? 'Junte-se à batalha territorial!' : 'Conquiste territórios para sua equipe!'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="sr-only">Nome</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isSignUp}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 ${isSignUp ? '' : 'rounded-t-md'} focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Escolha sua equipe:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['green', 'blue', 'red'] as const).map((teamColor) => (
                  <button
                    key={teamColor}
                    type="button"
                    onClick={() => setTeam(teamColor)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      team === teamColor
                        ? 'border-white bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${
                      teamColor === 'green' ? 'bg-green-600' :
                      teamColor === 'blue' ? 'bg-blue-600' :
                      'bg-red-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                      teamColor === 'green' ? 'bg-green-400' :
                      teamColor === 'blue' ? 'bg-blue-400' :
                      'bg-red-400'
                    }`} />
                    <span className="text-xs text-white capitalize">{teamColor}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={`text-sm text-center ${
              error.includes('Verifique seu email') ? 'text-green-400' : 'text-red-400'
            }`}>
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-green-400 hover:text-green-300 text-sm"
            >
              {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
