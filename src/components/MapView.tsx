import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGeo } from '@/hooks/useGeo'
import { useRealtime } from '@/hooks/useRealtime'
import { useGameStore } from '@/store/gameStore'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { useTerritoryStats } from '@/hooks/useTerritoryStats'

// Centro padrão do mapa (Gaia - Rua da Cortinha)
const defaultCenter: [number, number] = [41.1333, -8.6167]

function makeLabeledIcon(color: string, playerName?: string) {
  const html = `
  <div class="pawn-wrap" style="--c:${color}">
    <div class="pawn-dot"></div>
    ${playerName ? `<div class="pawn-name">${playerName}</div>` : ''}
  </div>`
  return L.divIcon({
    className: '',
    html,
    iconSize: [30, 42],
    iconAnchor: [15, 21],
  })
}

function makeFlagIcon(color: string) {
  const html = `
  <div style="
    width: 20px;
    height: 20px;
    background-color: ${color};
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
    font-weight: bold;
  ">
    🏁
  </div>`
  return L.divIcon({
    className: '',
    html,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const getPlayerIcon = (user: any, onlineUsers: any[]) => {
  const userData = onlineUsers.find(u => u.id === user?.id)
  const teamColor = userData?.team === 'blue' ? '#2563eb' : 
                   userData?.team === 'red' ? '#dc2626' : '#16a34a'
  const playerName = userData?.name || user?.user_metadata?.name || 'Jogador'
  return makeLabeledIcon(teamColor, playerName)
}

// Função para calcular o centro de um polígono
const calculatePolygonCenter = (coordinates: number[][]) => {
  if (!coordinates || coordinates.length === 0) return null
  
  let centerX = 0
  let centerY = 0
  
  for (const coord of coordinates) {
    centerX += coord[0] // longitude
    centerY += coord[1] // latitude
  }
  
  centerX /= coordinates.length
  centerY /= coordinates.length
  
  return [centerY, centerX] as [number, number] // [lat, lng] para Leaflet
}

// Função para calcular o tempo restante de um território
const calculateTimeRemaining = (expiresAt: string): string => {
  const now = new Date()
  const expiration = new Date(expiresAt)
  const diffMs = expiration.getTime() - now.getTime()
  
  if (diffMs <= 0) return '00:00'
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(diffSeconds / 60)
  const seconds = diffSeconds % 60
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Função para verificar se um território está expirado
const isTerritoryExpired = (expiresAt: string): boolean => {
  const now = new Date()
  const expiration = new Date(expiresAt)
  return expiration.getTime() <= now.getTime()
}

// Função para criar ícone com tempo restante
function makeTerritoryIcon(color: string, timeRemaining: string) {
  const html = `
  <div style="
    width: 24px;
    height: 24px;
    background-color: ${color};
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: white;
    font-weight: bold;
    text-align: center;
    line-height: 1;
  ">
    ${timeRemaining}
  </div>`
  return L.divIcon({
    className: '',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function CenterOnPawnButton() {
  const map = useMap()
  const { position } = useGeo()
  
  const handleCenter = () => {
    if (position) {
      map.setView([position[0], position[1]], map.getZoom())
    } else {
      map.setView(defaultCenter, map.getZoom())
    }
  }
  
  return (
    <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000 }}>
      <button 
        className="center-button" 
        onClick={handleCenter}
        style={{ 
          backgroundColor: '#2563EB', 
          color: 'white', 
          border: 'none', 
          padding: '8px 12px', 
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🎯 Centrar no peão
      </button>
    </div>
  )
}

export function MapView() {
  const { user } = useAuth()
  const { position, updatePosition } = useGeo()
  const { onlineUsers, territories, addTerritory, fetchTerritories, fetchOnlineUsers } = useRealtime()
  const { currentPlayer, initializeCurrentPlayer } = useGameStore()

  
  // Estado para o traço
  const [isTracing, setIsTracing] = useState(false)
  const [trace, setTrace] = useState<[number, number][]>([])
  const [paths, setPaths] = useState<[number, number][][]>([])
  const [areas, setAreas] = useState<[number, number][][]>([])
  const lastPosition = useRef<[number, number] | null>(null)
  
  // Controles de teclado para movimento
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!position) return
    
    const step = 0.0001
    let newPosition: [number, number] = [...position]
    
    switch (direction) {
      case 'up':
        newPosition = [position[0] + step, position[1]]
        break
      case 'down':
        newPosition = [position[0] - step, position[1]]
        break
      case 'left':
        newPosition = [position[0], position[1] - step]
        break
      case 'right':
        newPosition = [position[0], position[1] + step]
        break
    }
    
    updatePosition(newPosition)
  }

  // Ativar controles de teclado
  const { isMoving } = useKeyboardControls({
    onMove: handleMove,
    enabled: true
  })

  // Usar apenas a posição do useGeo para evitar conflitos
  const currentPosition = position || defaultCenter
  
  // Usar posição real do GPS sem ajustes artificiais
  const myTeam = currentPlayer?.team || onlineUsers.find(u => u.id === user?.id)?.team || 'green'
  
  // Posição do marker simplificada para performance
  const positionMemo = { 
    lat: currentPosition[0], 
    lng: currentPosition[1] 
  }
  
  // Debug: mostrar posição atual
  console.log('🗺️ MapView Position:', positionMemo, 'Original:', currentPosition)
  
  // Determinar cor da equipa do jogador atual (simplificado)
  const myTeamColor = myTeam === 'blue' ? '#2563eb' : myTeam === 'red' ? '#dc2626' : '#16a34a'
  
  // Debug: mostrar a equipe atual (removido para evitar spam)
  // console.log('🎨 Equipe atual:', myTeam, 'User ID:', user?.id, 'CurrentPlayer:', currentPlayer?.team, 'OnlineUsers:', onlineUsers.find(u => u.id === user?.id)?.team)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Função para calcular área de um polígono em km²
  const calculatePolygonArea = (points: [number, number][]): number => {
    if (points.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i][0] * points[j][1]
      area -= points[j][0] * points[i][1]
    }
    
    const areaInDegrees = Math.abs(area) / 2
    const areaInKm2 = areaInDegrees * 111 * 111
    
    return areaInKm2
  }

  // Adicionar posição ao traço quando estiver rastreando
  useEffect(() => {
    console.log('🎯 Trace Debug:', { 
      isTracing, 
      hasPosition: !!position, 
      position,
      traceLength: trace.length,
      lastPosition: lastPosition.current
    })
    if (!isTracing || !position) return

    // Usar a posição real do GPS para o traço
    const tracePosition: [number, number] = [currentPosition[0], currentPosition[1]]

    // Verificar se a posição mudou significativamente
    if (lastPosition.current) {
      const [lastLat, lastLng] = lastPosition.current
      const [currentLat, currentLng] = tracePosition
      
      const latDiff = Math.abs(currentLat - lastLat)
      const lngDiff = Math.abs(currentLng - lastLng)
      
      // Aproximadamente 0.5 metros (0.000005 graus) - mais sensível para iPhone
      if (latDiff < 0.000005 && lngDiff < 0.000005) {
        console.log('🎯 Position too close, skipping:', { latDiff, lngDiff })
        return // Posição não mudou o suficiente
      }
    }

    // Adicionar posição ao traço
    const newTrace = [...trace, tracePosition]
    setTrace(newTrace)
    lastPosition.current = tracePosition
    console.log('🎯 Added to trace:', tracePosition, 'Trace length:', newTrace.length)

    // Verificar se o traço se cruza consigo mesmo
    if (newTrace.length >= 4) {
      const lastPoint = newTrace[newTrace.length - 1]
      
      // Verificar se o último ponto está próximo de algum ponto anterior
      for (let i = 0; i < newTrace.length - 3; i++) {
        const distance = Math.sqrt(
          Math.pow(lastPoint[0] - newTrace[i][0], 2) + 
          Math.pow(lastPoint[1] - newTrace[i][1], 2)
        )
        
        // Se está a menos de 3 metros de um ponto anterior, fechar área
        if (distance < 0.00003) {
          // Construir área fechada
          const areaPoints: [number, number][] = [...newTrace.slice(i), lastPoint]
          
          if (areaPoints.length >= 3) {
            const areaKm2 = calculatePolygonArea(areaPoints)
            
            // Salvar área no Supabase (assíncrono)
            if (user && addTerritory && myTeam) {
              const polygon = {
                type: 'Polygon',
                coordinates: [areaPoints.map(point => [point[1], point[0]])] // GeoJSON usa [lng, lat]
              }
              
              console.log('🎯 Salvando território para equipe:', myTeam)
              addTerritory(polygon, areaKm2, myTeam).catch(error => {
                console.error('Erro ao salvar área:', error)
              })
            }
            
            setAreas(prev => {
              const newAreas = [...prev, areaPoints]
              return newAreas
            })
            
            // Limpar áreas locais após salvar no banco para evitar duplicação
            setTimeout(() => {
              setAreas([])
              setPaths([])
            }, 1000)
            
            // Continuar traçando a partir do último ponto
            setTrace([lastPoint])
            lastPosition.current = lastPoint
            return
          }
        }
      }
    }
  }, [position, isTracing, user, addTerritory, myTeam])

  // Controles de teclado e eventos para traço
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (isTracing) {
          setIsTracing(false)
          if (trace.length > 1) {
            setPaths(prev => [...prev, trace])
          }
          setTrace([])
          window.dispatchEvent(new CustomEvent('trace-state-updated', {
            detail: { isTracing: false }
          }))
        } else {
          setIsTracing(true)
          setTrace([])
          lastPosition.current = currentPosition ? [currentPosition[0], currentPosition[1]] : null
          window.dispatchEvent(new CustomEvent('trace-state-updated', {
            detail: { isTracing: true }
          }))
        }
      }
    }

    // Escutar eventos de start/stop trace dos controles
    const handleStartTrace = () => {
      console.log('🎯 MapView: Received start-trace event')
      setIsTracing(true)
      setTrace([])
      lastPosition.current = currentPosition ? [currentPosition[0], currentPosition[1]] : null
      window.dispatchEvent(new CustomEvent('trace-state-updated', {
        detail: { isTracing: true }
      }))
    }

    const handleStopTrace = () => {
      console.log('🎯 MapView: Received stop-trace event')
      setIsTracing(false)
      if (trace.length > 1) {
        setPaths(prev => [...prev, trace])
      }
      setTrace([])
      window.dispatchEvent(new CustomEvent('trace-state-updated', {
        detail: { isTracing: false }
      }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('start-trace', handleStartTrace)
    window.addEventListener('stop-trace', handleStopTrace)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('start-trace', handleStartTrace)
      window.removeEventListener('stop-trace', handleStopTrace)
    }
  }, [isTracing, trace, position, currentPosition])

  // Inicializar currentPlayer quando o usuário estiver disponível
  useEffect(() => {
    if (user && !currentPlayer) {
      initializeCurrentPlayer()
    }
  }, [user, currentPlayer, initializeCurrentPlayer])

  // Timeout para forçar carregamento do mapa
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        setMapLoaded(true)
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [mapLoaded])

  // Atualizar tempo restante dos territórios a cada 5 segundos (reduzido para evitar spam)
  const [timeUpdate, setTimeUpdate] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(prev => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Disparar evento quando áreas mudarem
  useEffect(() => {
    const totalAreaKm2 = areas.reduce((sum, a) => sum + calculatePolygonArea(a), 0)
    window.dispatchEvent(new CustomEvent('areas-updated', {
      detail: { totalAreaKm2 }
    }))
  }, [areas])

  // Limpar áreas locais quando territórios do banco forem atualizados
  useEffect(() => {
    if (territories.length > 0) {
      // Se há territórios no banco, limpar áreas locais para evitar duplicação
      setAreas([])
      setPaths([])
    }
  }, [territories.length])

  // Handler para quando o mapa carrega
  const handleMapLoad = () => {
    setMapLoaded(true)
    setMapError(null)
  }

  // Handler para erros do mapa
  const handleMapError = (error?: any) => {
    console.error('MapView: Erro no carregamento do mapa:', error)
    setMapError(error?.message || 'Erro desconhecido')
    setTimeout(() => setMapLoaded(true), 2000)
  }

  // Se o mapa ainda não carregou, mostrar loading
  if (!mapLoaded) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🗺️</div>
          <div>Carregando mapa...</div>
          <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
            Verificando GPS e conectividade
          </div>
          {mapError && (
            <div style={{ fontSize: '10px', marginTop: '5px', color: '#ef4444' }}>
              Erro: {mapError}
            </div>
          )}
          <button 
            onClick={() => setMapLoaded(true)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Forçar Carregamento
          </button>
        </div>
      </div>
    )
  }

  // Fallback se Leaflet não estiver disponível
  if (typeof L === 'undefined') {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
          <div>Erro: Leaflet não carregado</div>
          <div style={{ fontSize: '12px', marginTop: '10px', opacity: '0.7' }}>
            Tente recarregar a página
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapLoad}
      >
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            error: handleMapError
          }}
        />
        
        {/* Peão do jogador */}
        <Marker position={positionMemo} icon={getPlayerIcon(user, onlineUsers)} />

        {/* Linha de traço atual */}
        {trace.length > 0 && (
          <>
            {console.log('🎯 Rendering trace with', trace.length, 'points:', trace)}
            <Polyline 
              positions={trace.map(([lat, lng]) => ({ lat, lng }))} 
              color={myTeamColor} 
              pathOptions={{ weight: 6, zIndex: 1000 }} 
            />
          </>
        )}
        
        {/* Paths persistentes */}
        {paths.map((path, i) => (
          <Polyline 
            key={`path-${i}`} 
            positions={path.map(([lat, lng]) => ({ lat, lng }))} 
            color={myTeamColor} 
            pathOptions={{ weight: 8 }} 
          />
        ))}
        
        {/* Áreas fechadas locais */}
        {areas.map((area, i) => {
          // Calcular centro da área local
          const center = calculatePolygonCenter(area.map(([lat, lng]) => [lng, lat]))
          
          return (
            <div key={`area-local-${i}`}>
              <Polygon 
                positions={area.map(([lat, lng]) => ({ lat, lng }))} 
                pathOptions={{ 
                  color: myTeamColor, 
                  fillColor: myTeamColor, 
                  fillOpacity: 0.3,
                  weight: 3 
                }} 
              />
              {center && (
                <Marker
                  position={center}
                  icon={makeFlagIcon(myTeamColor)}
                />
              )}
            </div>
          )
        })}

                {/* Territórios salvos no banco (limitados para performance) */}
        {territories
          .filter(territory => {
            // Filtrar territórios expirados apenas se expires_at existir
            if (!territory.expires_at) return true
            const expired = isTerritoryExpired(territory.expires_at)
            if (expired) {
              // console.log('🗑️ Filtrando território expirado:', territory.id)
            }
            return !expired
          })
          .slice(0, 20)
          .map((territory, i) => {
          // Usar timeUpdate para forçar re-renderização e atualizar o tempo
          const _ = timeUpdate
          
          // Debug: verificar se o território tem expires_at (removido para evitar spam)
          // console.log('🔍 Território:', territory.id, 'expires_at:', territory.expires_at, 'expirado:', isTerritoryExpired(territory.expires_at))
          
          try {
            const coordinates = territory.polygon.coordinates[0]
            const positions = coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0]
            }))
            const teamColor = territory.team_id === 'blue' ? '#2563eb' :
                             territory.team_id === 'red' ? '#dc2626' : '#16a34a'

            // Calcular centro do polígono para a bandeira
            const center = calculatePolygonCenter(coordinates)
            
            // Calcular tempo restante (verificar se expires_at existe)
            const timeRemaining = territory.expires_at ? calculateTimeRemaining(territory.expires_at) : '--:--'

            return (
              <div key={`territory-${territory.id}`}>
                <Polygon
                  positions={positions}
                  pathOptions={{
                    color: teamColor,
                    fillColor: teamColor,
                    fillOpacity: 0.4,
                    weight: 2
                  }}
                />
                {center && (
                  <Marker
                    position={center}
                    icon={makeTerritoryIcon(teamColor, timeRemaining)}
                  />
                )}
              </div>
            )
          } catch (error) {
            return null
          }
        })}



        <CenterOnPawnButton />
      </MapContainer>
      

    </div>
  )
}


