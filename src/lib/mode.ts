import { safeStorage } from '@/lib/storage'

export function applyModeFromUrl() {
  try {
    const url = new URL(window.location.href)
    const mode = url.searchParams.get('mode')
    if (mode === 'mock' || mode === 'live') {
      safeStorage.setItem('gameMode', mode)
      // Limpar query param para evitar reaplicar
      url.searchParams.delete('mode')
      const clean = url.pathname + (url.hash || '')
      window.history.replaceState({}, '', clean)
    }
  } catch {
    // ignore
  }
}


