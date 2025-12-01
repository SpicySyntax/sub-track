import React, { useEffect, useState, FormEvent } from 'react'
import { getAllLogs as dbGetAll, addLog as dbAddLog, clearAll as dbClearAll, init as dbInit, exportRaw as dbExportRaw } from './db'

// --- TYPE DEFINITIONS ---
interface LogEntry {
  id: string
  substance: string
  notes: string
  feelings?: string[]
  dosage?: string
  timestamp: string // ISO string for storage
}

const formatDateTime = (iso: string): string => {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

// Limited set of substance options shown in the UI
const SUBSTANCE_OPTIONS = [
  'Marijuana',
  'Caffeine',
  'Alcohol',
  'Nicotine',
]

const FEELING_OPTIONS = ['stressed', 'sad', 'angry', 'happy', 'relaxed', 'energized', 'tired']

// Contextual dosage options by substance
const DOSAGE_OPTIONS: Record<string, { label: string; description: string }[]> = {
  Marijuana: [
    { label: '5mg', description: 'Light (edible)' },
    { label: '10mg', description: 'Standard (edible)' },
    { label: '20mg', description: 'Strong (edible)' },
    { label: '1 hit', description: 'Single hit (flower)' },
    { label: '2-3 hits', description: 'Few hits (flower)' },
    { label: 'Dab', description: 'Concentrate' },
  ],
  Caffeine: [
    { label: '1 cup', description: 'Coffee' },
    { label: '2 cups', description: 'Coffee' },
    { label: '1 shot espresso', description: 'Espresso' },
    { label: '2 shots espresso', description: 'Espresso' },
    { label: '1 cup tea', description: 'Tea' },
  ],
  Alcohol: [
    { label: '1 drink', description: 'Single standard drink' },
    { label: '2 drinks', description: 'Two standard drinks' },
    { label: '3 drinks', description: 'Three standard drinks' },
    { label: '4+ drinks', description: 'Four or more drinks' },
  ],
  Nicotine: [
    { label: '1 cigarette', description: 'Single cigarette' },
    { label: 'Few puffs', description: 'Vape/e-cig' },
    { label: '1 pouch', description: 'Nicotine pouch' },
  ],
}

// localStorage key is no longer used; persistence now via sqlite in IndexedDB

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [substance, setSubstance] = useState('')
  const [notes, setNotes] = useState('')
  const [feelings, setFeelings] = useState<string[]>([])
  const [dosage, setDosage] = useState('')

  const [dbReady, setDbReady] = useState(false)

  // Initialize DB and load logs once
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        await dbInit()
        const rows = await dbGetAll()
        if (!mounted) return
        // rows use the same shape as LogEntry but feelings is stored as JSON string
        const parsed = rows.map((r: any) => ({
          id: r.id,
          substance: r.substance,
          notes: r.notes || '',
          feelings: r.feelings ? JSON.parse(r.feelings) : undefined,
          dosage: r.dosage || undefined,
          timestamp: r.timestamp,
        }))
        setLogs(parsed)
        setDbReady(true)
      } catch (e) {
        console.warn('Failed to initialize DB', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!substance.trim()) return
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      substance: substance.trim(),
      notes: notes.trim(),
      feelings: feelings.length ? feelings : undefined,
      dosage: dosage.trim() || undefined,
      timestamp: new Date().toISOString(),
    }
    try {
      // persist to db then update UI optimistically
      await dbAddLog({
        id: newLog.id,
        substance: newLog.substance,
        notes: newLog.notes || null,
        feelings: newLog.feelings ? JSON.stringify(newLog.feelings) : null,
        dosage: newLog.dosage ?? null,
        timestamp: newLog.timestamp,
      } as any)
      setLogs((s) => [newLog, ...s])
    } catch (err) {
      console.warn('Failed to save log to DB', err)
    }

    setSubstance('')
    setNotes('')
    setFeelings([])
    setDosage('')
  }

  const clearAll = async () => {
    if (!confirm('Clear all logs? This cannot be undone.')) return
    try {
      await dbClearAll()
      setLogs([])
    } catch (err) {
      console.warn('Failed to clear DB', err)
    }
  }

  return (
    <div className="app-root">
      <div className="container">
        <header className="header">
          <h1>Sub-Track</h1>
          <p className="subtitle">A mindful log for harm reduction.</p>
        </header>

        <form className="card form" onSubmit={handleSubmit}>
          <h2>New Log</h2>
          <label>
            <div className="label">Substance</div>
            <div className="substance-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUBSTANCE_OPTIONS.map((s) => {
                const selected = substance === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSubstance(s)
                      setDosage('')
                    }}
                    aria-pressed={selected}
                    className={selected ? 'pill selected substance-pill' : 'pill substance-pill'}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </label>

          <label>
            <div className="label">Feelings</div>
            <div className="feelings-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FEELING_OPTIONS.map((f) => {
                const selected = feelings.includes(f)
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFeelings((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))
                    }}
                    aria-pressed={selected}
                    className={selected ? 'pill selected' : 'pill'}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: selected ? '1px solid #333' : '1px solid #ccc',
                      background: selected ? '#e6f0ff' : 'transparent',
                      cursor: 'pointer',
                      /* Ensure sufficient contrast: when a feeling is selected we use a dark text color
                         because the selected background is a light color (#e6f0ff). This overrides
                         the global .pill.selected text color which is light (for other pill types). */
                      color: selected ? '#07111a' : undefined,
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </label>

          {substance && DOSAGE_OPTIONS[substance] && (
            <label>
              <div className="label">Dosage</div>
              <div className="dosage-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {DOSAGE_OPTIONS[substance].map((option) => {
                  const selected = dosage === option.label
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setDosage(option.label)}
                      aria-pressed={selected}
                      className={selected ? 'pill selected' : 'pill'}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Or enter custom dosage"
              />
            </label>
          )}

          {substance && !DOSAGE_OPTIONS[substance] && (
            <label>
              <div className="label">Dosage</div>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 10 mg, 1 drink, etc. (optional)"
              />
            </label>
          )}

          {!substance && (
            <label>
              <div className="label">Dosage</div>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Select a substance first (optional)"
                disabled
              />
            </label>
          )}

          <label>
            <div className="label">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Context, context details (optional)"
            />
          </label>

          <div className="actions">
            <button type="submit" className="btn primary">
              Add Log Entry
            </button>
            <button type="button" className="btn ghost" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </form>

        <section>
          <div className="section-header">
            <h2>History</h2>
            <div className="muted">{logs.length} entries{!dbReady ? ' (loading...)' : ''}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                try {
                  const rows = await dbGetAll()
                  const parsed = rows.map((r: any) => ({
                    id: r.id,
                    substance: r.substance,
                    notes: r.notes || '',
                    feelings: r.feelings ? JSON.parse(r.feelings) : undefined,
                    dosage: r.dosage || undefined,
                    timestamp: r.timestamp,
                  }))
                  setLogs(parsed)
                  console.debug('UI: reloaded from DB, rows=', parsed.length)
                } catch (err) {
                  console.warn('UI: reload from DB failed', err)
                }
              }}
            >
              Reload from DB
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                try {
                  const data = await dbExportRaw()
                  const buf = data instanceof Uint8Array ? (data as Uint8Array).buffer as ArrayBuffer : (data as any)
                  const blob = new Blob([buf], { type: 'application/octet-stream' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'subtrack.sqlite'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (err) {
                  console.warn('UI: export failed', err)
                }
              }}
            >
              Export DB
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="card empty">Your log history will appear here.</div>
          ) : (
            <ul className="list">
              {logs.map((log) => (
                <li key={log.id} className="card item">
                  <div className="item-head">
                    <div className="item-title">{log.substance}</div>
                    <div className="item-time">{formatDateTime(log.timestamp)}</div>
                  </div>
                  {log.feelings && log.feelings.length > 0 && (
                    <div className="item-feelings" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {log.feelings.map((f) => (
                        <span key={f} className="pill history-pill">{f}</span>
                      ))}
                    </div>
                  )}

                  {log.dosage && (
                    <div className="item-dosage" style={{ color: '#cfe0ff', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--muted)', marginRight: 6 }}>Dose:</strong>
                      {log.dosage}
                    </div>
                  )}

                  {log.notes && <div className="item-notes">{log.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
