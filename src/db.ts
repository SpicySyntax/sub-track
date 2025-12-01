import initSqlJs from 'sql.js'
import localforage from 'localforage'

// Key used in IndexedDB (via localforage) to store the SQLite file
const DB_KEY = 'subtrack_sqlite_v1'
let SQL: any = null
let db: any = null
let initialized = false

// Minimal log row mapping used by the app. We keep this loose (any) to avoid
// tight coupling with App.tsx types in this small patch.
export type Row = {
  id: string
  substance: string
  notes: string | null
  feelings: string | null // JSON stringified array or null
  dosage: string | null
  timestamp: string
}

async function locateWasm(): Promise<string> {
  // Prefer local copy in /sql-wasm.wasm (user can place it in public/).
  // Fall back to CDN if not available.
  const localUrl = '/sql-wasm.wasm'
  try {
    // quick fetch to see if exists (fast-fail)
    const res = await fetch(localUrl, { method: 'HEAD' })
    if (res.ok) {
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      const cl = res.headers.get('content-length')
      // Ensure the server actually returns a wasm file (avoid HTML index fallbacks or service-worker responses)
      if (ct.includes('application/wasm')) {
        console.debug('db: found local wasm with correct MIME')
        return localUrl
      }
      // some servers may not set content-type; fall back if content-length looks reasonable
      if (cl && parseInt(cl, 10) > 100) {
        console.debug('db: found local wasm-like resource (content-length check)')
        return localUrl
      }
      console.debug('db: local wasm present but wrong MIME or too small, falling back to CDN; content-type=', ct, 'content-length=', cl)
    }
  } catch (e) {
    // ignore and fall back
  }
  // CDN fallback
  return 'https://sql.js.org/dist/sql-wasm.wasm'
}

async function ensureInit() {
  if (initialized) return
  const wasmUrl = await locateWasm()
  SQL = await initSqlJs({ locateFile: () => wasmUrl })

  // Try to load DB from storage
  const saved = await localforage.getItem<any>(DB_KEY)
  if (saved) {
    // localforage may return ArrayBuffer, Uint8Array or Blob depending on platform
    let buffer: ArrayBuffer
    if (saved instanceof Blob) {
      buffer = await saved.arrayBuffer()
    } else if (saved instanceof Uint8Array) {
      buffer = (saved as Uint8Array).buffer as ArrayBuffer
    } else if (saved instanceof ArrayBuffer) {
      buffer = saved
    } else {
      // try to coerce
      buffer = new Uint8Array(saved).buffer
    }
    const arr = new Uint8Array(buffer)
    console.debug('db: loading saved DB, bytes=', arr.byteLength)
    db = new SQL.Database(arr)
  } else {
    console.debug('db: no saved DB found; creating new in-memory DB')
    db = new SQL.Database()
  }

  // Ensure table exists
  db.run(
    `CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      substance TEXT NOT NULL,
      notes TEXT,
      feelings TEXT,
      dosage TEXT,
      timestamp TEXT NOT NULL
    );`
  )

  initialized = true
}

async function persist() {
  if (!db) return
  try {
    const data: Uint8Array = db.export()
    // store ArrayBuffer for smaller IndexedDB footprint
    await localforage.setItem(DB_KEY, data.buffer)
    console.debug('db: persisted, bytes=', data.byteLength)
  } catch (err) {
    console.error('db: persist failed', err)
  }
}

export async function getAllLogs(): Promise<Row[]> {
  await ensureInit()
  const res = db.exec('SELECT id, substance, notes, feelings, dosage, timestamp FROM logs ORDER BY timestamp DESC')
  if (!res || res.length === 0) return []
  console.debug('db: getAllLogs rows=', res[0].values.length)
  const values = res[0].values as any[]
  const cols = res[0].columns as string[]
  return values.map((row) => {
    const obj: any = {}
    for (let i = 0; i < cols.length; i++) obj[cols[i]] = row[i]
    return obj as Row
  })
}

export async function addLog(row: Row) {
  await ensureInit()
  const stmt = db.prepare('INSERT INTO logs (id, substance, notes, feelings, dosage, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
  try {
    stmt.run([row.id, row.substance, row.notes ?? null, row.feelings ?? null, row.dosage ?? null, row.timestamp])
  } finally {
    stmt.free()
  }
  await persist()
  console.debug('db: addLog id=', row.id)
}

export async function updateLog(row: Row) {
  await ensureInit()
  const stmt = db.prepare('UPDATE logs SET substance = ?, notes = ?, feelings = ?, dosage = ?, timestamp = ? WHERE id = ?')
  try {
    stmt.run([row.substance, row.notes ?? null, row.feelings ?? null, row.dosage ?? null, row.timestamp, row.id])
  } finally {
    stmt.free()
  }
  await persist()
  console.debug('db: updateLog id=', row.id)
}

export async function clearAll() {
  await ensureInit()
  db.run('DELETE FROM logs')
  await persist()
}

export async function exportRaw(): Promise<Uint8Array> {
  await ensureInit()
  return db.export()
}

export async function importRaw(buffer: ArrayBuffer | Uint8Array) {
  // Replace current DB with provided buffer
  const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  db = new SQL.Database(arr)
  // ensure schema (in case import comes from older/newer source)
  db.run(
    `CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      substance TEXT NOT NULL,
      notes TEXT,
      feelings TEXT,
      dosage TEXT,
      timestamp TEXT NOT NULL
    );`
  )
  await persist()
}

export async function init() {
  await ensureInit()
}
