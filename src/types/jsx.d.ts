export {}

declare global {
  namespace JSX {
    // Minimal fallback so linter doesn't complain when type libs aren't resolved
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}


