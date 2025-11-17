import React, { useEffect, useState, FormEvent } from 'react'

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
  'Caffeine',
  'Marijuana',
  'Alcohol',
  'Nicotine',
]

const FEELING_OPTIONS = ['sad', 'stressed', 'angry', 'happy', 'energized', 'tired']

const STORAGE_KEY = 'subtrack_logs_v1'

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [substance, setSubstance] = useState('')
  const [notes, setNotes] = useState('')
  const [feelings, setFeelings] = useState<string[]>([])
  const [dosage, setDosage] = useState('')

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: LogEntry[] = JSON.parse(raw)
        setLogs(parsed)
      }
    } catch (e) {
      console.warn('Failed to read logs from storage', e)
    }
  }, [])

  // Persist when logs change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    } catch (e) {
      console.warn('Failed to save logs to storage', e)
    }
  }, [logs])

  const handleSubmit = (e: FormEvent) => {
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
    setLogs((s) => [newLog, ...s])
    setSubstance('')
    setNotes('')
    setFeelings([])
    setDosage('')
  }

  const clearAll = () => {
    if (confirm('Clear all logs? This cannot be undone.')) {
      setLogs([])
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
            <select
              value={substance}
              onChange={(e) => setSubstance(e.target.value)}
              required
            >
              <option value="" disabled>
                Select substance...
              </option>
              {SUBSTANCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </label>

          <label>
            <div className="label">Dosage</div>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 10 mg, 1 drink, etc. (optional)"
            />
          </label>

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
            <div className="muted">{logs.length} entries</div>
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
