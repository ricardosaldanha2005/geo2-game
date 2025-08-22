export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  }
}


