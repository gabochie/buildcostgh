// Tiny IndexedDB wrapper for offline-first calculator + push-independent queue.
// No dependencies. DB: "buildcost-offline" v1, store "estimate-queue" (keyPath id).

export interface QueuedEstimate {
  id: string
  inputs: Record<string, unknown>
  queuedAt: number
  synced?: boolean
}

const DB_NAME = "buildcost-offline"
const DB_VERSION = 1
const STORE = "estimate-queue"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function queueEstimate(inputs: Record<string, unknown>): Promise<string> {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put({ id, inputs, queuedAt: Date.now() } satisfies QueuedEstimate)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  // Ask the service worker to flush via Background Sync when possible.
  try {
    const reg = await navigator.serviceWorker?.ready
    const sync = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } })?.sync
    await sync?.register("bcgh-sync-estimates")
  } catch {
    // Background Sync unsupported — online flush in Step5Result covers it.
  }
  return id
}

export async function getQueuedEstimates(): Promise<QueuedEstimate[]> {
  const db = await openDb()
  const rows = await new Promise<QueuedEstimate[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result as QueuedEstimate[]) || [])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return rows
}

export async function removeQueuedEstimate(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** POST every queued estimate to /api/calculator; drop the ones the server accepts. */
export async function flushEstimateQueue(
  post: (inputs: Record<string, unknown>) => Promise<boolean>,
): Promise<{ flushed: number; remaining: number }> {
  const queued = await getQueuedEstimates()
  let flushed = 0
  for (const item of queued) {
    try {
      const ok = await post(item.inputs)
      if (ok) {
        await removeQueuedEstimate(item.id)
        flushed++
      }
    } catch {
      // keep queued
    }
  }
  return { flushed, remaining: queued.length - flushed }
}
