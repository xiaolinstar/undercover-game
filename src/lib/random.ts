export function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0

  // Prefer cryptographically-strong randomness when available
  const getRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)
  if (getRandomValues) {
    const buf = new Uint32Array(1)
    getRandomValues(buf)
    return (buf[0] ?? 0) % maxExclusive
  }

  return Math.floor(Math.random() * maxExclusive)
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}
