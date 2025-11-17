import React, { useEffect, useState, FormEvent } from 'react'

// --- TYPE DEFINITIONS ---
interface LogEntry {
  id: string
  substance: string
  notes: string
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

const STORAGE_KEY = 'subtrack_logs_v1'

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [substance, setSubstance] = useState('')
  const [notes, setNotes] = useState('')

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
      timestamp: new Date().toISOString(),
    }
    setLogs((s) => [newLog, ...s])
    setSubstance('')
    setNotes('')
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
            <input
              value={substance}
              onChange={(e) => setSubstance(e.target.value)}
              placeholder="e.g., Alcohol, Caffeine"
              required
            />
          </label>

          <label>
            <div className="label">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Context, feelings, amount (optional)"
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
