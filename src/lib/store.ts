// Device-stored collections (AsyncStorage; localStorage on the web). Each
// collection lives under its own key. Data stays on this device only.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

export type Base = { id: string; created_at: string; updated_at: string }

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

async function read<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function useLocalCollection<T extends Base>(key: string) {
  const [items, setItems] = useState<T[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    read<T>(key).then((rows) => {
      if (!active) return
      setItems(rows)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [key])

  // Every change goes through a functional update so rapid taps never lose rows.
  const save = (update: (rows: T[]) => T[]) => {
    setItems((prev) => {
      const next = update(prev)
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {})
      return next
    })
  }

  return {
    items,
    loaded,
    create(input: Omit<T, keyof Base>) {
      const now = new Date().toISOString()
      const row = { ...input, id: newId(), created_at: now, updated_at: now } as T
      save((rows) => [row, ...rows])
      return row
    },
    update(id: string, patch: Partial<Omit<T, keyof Base>>) {
      save((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, ...patch, updated_at: new Date().toISOString() } : row,
        ),
      )
    },
    remove(id: string) {
      save((rows) => rows.filter((row) => row.id !== id))
    },
    clear() {
      save(() => [])
    },
  }
}
