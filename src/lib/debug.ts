type DebugEntry = { ts: number; tag: string; msg: string; extra?: unknown }

class DebugLogger {
  private enabled = false
  private buffer: DebugEntry[] = []
  private max = 500

  setEnabled(on: boolean) {
    this.enabled = on
    ;(window as any).__DBG_ENABLED__ = on
  }

  isEnabled() {
    return this.enabled || (window as any).__DBG_ENABLED__ === true
  }

  enableFromQuery() {
    try {
      const p = new URLSearchParams(window.location.search)
      const on = p.get('debug') === '1'
      if (on) this.setEnabled(true)
    } catch {}
  }

  log(tag: string, msg: string, extra?: unknown) {
    if (!this.isEnabled()) return
    const entry: DebugEntry = { ts: Date.now(), tag, msg, extra }
    this.buffer.push(entry)
    if (this.buffer.length > this.max) this.buffer.shift()
    // Also log to console for convenience
    // eslint-disable-next-line no-console
    console.debug(`[DBG][${tag}] ${msg}`, extra ?? '')
  }

  getLogs(): DebugEntry[] {
    return [...this.buffer]
  }

  clear() {
    this.buffer = []
  }
}

export const dbg = new DebugLogger()


