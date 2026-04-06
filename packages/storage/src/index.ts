export type StorageDriver = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createJsonStorage(driver: StorageDriver) {
  function readJson<T>(key: string): T | null {
    try {
      const raw = driver.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  function writeJson(key: string, value: unknown) {
    try {
      driver.setItem(key, JSON.stringify(value))
    } catch {
      // ignore storage failures (private mode / quota / etc.)
    }
  }

  function removeKey(key: string) {
    try {
      driver.removeItem(key)
    } catch {
      // ignore
    }
  }

  return { readJson, writeJson, removeKey }
}

export function createWebStorageDriver(): StorageDriver {
  return {
    getItem(key) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        globalThis.localStorage?.setItem(key, value)
      } catch {
        // ignore
      }
    },
    removeItem(key) {
      try {
        globalThis.localStorage?.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}

export function createUniStorageDriver(): StorageDriver {
  // `uni` is a global in uni-app runtimes.
  const u = (globalThis as any).uni
  return {
    getItem(key) {
      try {
        const raw = u?.getStorageSync?.(key)
        if (raw == null || raw === '') return null
        return String(raw)
      } catch {
        return null
      }
    },
    setItem(key, value) {
      try {
        u?.setStorageSync?.(key, value)
      } catch {
        // ignore
      }
    },
    removeItem(key) {
      try {
        u?.removeStorageSync?.(key)
      } catch {
        // ignore
      }
    },
  }
}

