import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/hooks/useAuth'

export function Leaderboard() {
  const { onlineUsers } = useRealtime()
  const { user } = useAuth()



  const getTeamBgColor = (teamColor: string) => {
    switch (teamColor) {
      case 'green': return 'bg-green-600'
      case 'blue': return 'bg-blue-600'
      case 'red': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🏆 Leaderboard</h1>
        
        {/* Ranking das Equipes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ranking por km² Conquistados</h2>
          <div className="text-center text-gray-400">
            Ranking das equipes em desenvolvimento...
          </div>
        </div>

        {/* Jogadores Online */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Jogadores Online ({onlineUsers.length})</h2>
          <div className="grid gap-3">
            {onlineUsers.map((player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg border ${
                  player.id === user?.id ? 'border-green-400 bg-green-400 bg-opacity-10' : 'border-gray-600 bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getTeamBgColor(player.team)}`} />
                    <span className={`font-medium ${player.id === user?.id ? 'text-green-400' : ''}`}>
                      {player.name}
                    </span>
                    {player.id === user?.id && <span className="text-xs text-green-400">(Você)</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">0</div>
                    <div className="text-xs text-gray-400">km²</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas do Usuário */}
        {user && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Suas Estatísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-sm text-gray-400">km² Conquistados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  N/A
                </div>
                <div className="text-sm text-gray-400">Sua Equipe</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
