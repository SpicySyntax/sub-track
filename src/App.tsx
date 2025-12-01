import React, { useEffect, useState, FormEvent, useMemo } from 'react'
import { getAllLogs as dbGetAll, addLog as dbAddLog, updateLog as dbUpdateLog, clearAll as dbClearAll, init as dbInit, exportRaw as dbExportRaw } from './db'

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
    { label: '2.5mg', description: 'Micro (edible)' },
    { label: '5mg', description: 'Light (edible)' },
    { label: '10mg', description: 'Standard (edible)' },
    { label: '20mg', description: 'Strong (edible)' },
    { label: '1 hit', description: 'Single hit (flower)' },
    { label: '2-3 hits', description: 'Few hits (flower)' },
    { label: '1 Dab', description: 'Concentrate' },
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
    { label: '1 pouch', description: 'Nicotine pouch (3mg)' },
  ],
}

// localStorage key is no longer used; persistence now via sqlite in IndexedDB

// --- Helpers for trends ---
const getDateKey = (iso: string) => {
  const d = new Date(iso)
  // yyyy-mm-dd
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const defaultSubstanceColors: Record<string, string> = {
  Marijuana: '#8bd99b',
  Caffeine: '#ffd166',
  Alcohol: '#ff8b8b',
  Nicotine: '#bdbdf6',
}

function buildDateRange(days: number | null) {
  // returns array of date keys from (today - days + 1) .. today inclusive
  const arr: string[] = []
  if (days === null) return arr
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    arr.push(getDateKey(d.toISOString()))
  }
  return arr
}

function aggregateUsageOverTime(logs: any[], days: number | null, substances: string[]) {
  const labels = days ? buildDateRange(days) : []
  const series: Record<string, number[]> = {}
  const subs = substances.length ? substances : []
  subs.forEach((s) => {
    series[s] = labels.map(() => 0)
  })

  for (const l of logs) {
    if (!l.substance) continue
    if (!subs.includes(l.substance)) continue
    if (!l.timestamp) continue
    const key = getDateKey(l.timestamp)
    const idx = labels.indexOf(key)
    if (idx >= 0) series[l.substance][idx]++
  }

  return { labels, series }
}

function aggregateFrequencies(logs: any[], days: number | null) {
  const counts: Record<string, number> = {}
  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null
  for (const l of logs) {
    if (!l.substance) continue
    if (cutoff && new Date(l.timestamp).getTime() < cutoff) continue
    counts[l.substance] = (counts[l.substance] || 0) + 1
  }
  return counts
}

function aggregateFeelings(logs: any[], days: number | null, filterSubstance: string | 'All') {
  const counts: Record<string, number> = {}
  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : null
  for (const l of logs) {
    if (cutoff && new Date(l.timestamp).getTime() < cutoff) continue
    if (filterSubstance !== 'All' && l.substance !== filterSubstance) continue
    if (!l.feelings || !Array.isArray(l.feelings)) continue
    for (const f of l.feelings) counts[f] = (counts[f] || 0) + 1
  }
  return counts
}

// --- Simple SVG chart components ---
function MultiLineChart({ labels, series }: { labels: string[]; series: Record<string, number[]> }) {
  const width = 640
  const height = 140
  const pad = 24
  const allValues = Object.values(series).flat()
  const max = allValues.length ? Math.max(...allValues) : 1

  const pointsFor = (values: number[]) =>
    values.map((v, i) => {
      const x = pad + (i / Math.max(1, labels.length - 1)) * (width - pad * 2)
      const y = height - pad - (v / max) * (height - pad * 2)
      return `${x},${y}`
    })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 160 }}>
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {/* grid lines */}
      <g stroke="rgba(255,255,255,0.04)">
        <line x1={pad} x2={width - pad} y1={pad} y2={pad} />
        <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} />
        <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} />
      </g>
      {Object.entries(series).map(([name, vals]) => {
        const pts = pointsFor(vals).join(' ')
        const color = defaultSubstanceColors[name] || '#9fb6ff'
        return (
          <g key={name}>
            <polyline fill="none" stroke={color} strokeWidth={2} points={pts} strokeLinejoin="round" strokeLinecap="round" />
            {/* dots */}
            {vals.map((v, i) => {
              const x = pad + (i / Math.max(1, labels.length - 1)) * (width - pad * 2)
              const y = height - pad - (v / max) * (height - pad * 2)
              return <circle key={i} cx={x} cy={y} r={3} fill={color} />
            })}
          </g>
        )
      })}
    </svg>
  )
}

function VerticalBarChart({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const width = 640
  const height = 140
  const pad = 24
  const max = items.length ? Math.max(...items.map((i) => i.value)) : 1
  const bw = (width - pad * 2) / Math.max(1, items.length)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 160 }}>
      {items.map((it, i) => {
        const x = pad + i * bw + bw * 0.1
        const barW = bw * 0.8
        const h = (it.value / Math.max(1, max)) * (height - pad * 2)
        const y = height - pad - h
        const cx = x + barW / 2
        return (
          <g key={it.label}>
            <rect x={x} y={y} width={barW} height={h} fill={it.color || '#7fbfff'} rx={6} />
            {/* value above bar */}
            <text x={cx} y={y - 6} fontSize={12} fill="var(--muted)" textAnchor="middle">{it.value}</text>
            {/* label below bar */}
            <text x={cx} y={height - pad + 16} fontSize={12} fill="var(--muted)" textAnchor="middle">{it.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function HorizontalBarChart({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const width = 640
  const height = Math.max(40, items.length * 28 + 20)
  const padL = 120
  const padR = 20
  const max = items.length ? Math.max(...items.map((i) => i.value)) : 1
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: Math.min(240, height) }}>
      {items.map((it, i) => {
        const y = 10 + i * 28
        const w = ((width - padL - padR) * it.value) / Math.max(1, max)
        return (
          <g key={it.label} transform={`translate(0, ${y})`}>
            <text x={8} y={14} fontSize={12} fill="var(--muted)">{it.label}</text>
            <rect x={padL} y={2} width={w} height={18} fill={it.color || '#7fbfff'} rx={6} />
            <text x={padL + w + 8} y={14} fontSize={12} fill="var(--muted)">{it.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [substance, setSubstance] = useState('')
  const [notes, setNotes] = useState('')
  const [feelings, setFeelings] = useState<string[]>([])
  const [dosage, setDosage] = useState('')

  const [dbReady, setDbReady] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editingTimestamp, setEditingTimestamp] = useState('')

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

  const startEditingTime = (log: LogEntry) => {
    const date = new Date(log.timestamp)
    // Format as datetime-local input value: YYYY-MM-DDTHH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`
    setEditingLogId(log.id)
    setEditingTimestamp(formatted)
  }

  const saveEditedTime = async () => {
    if (!editingLogId || !editingTimestamp) return
    try {
      const newDate = new Date(editingTimestamp)
      const log = logs.find((l) => l.id === editingLogId)
      if (!log) return

      const updatedLog: LogEntry = {
        ...log,
        timestamp: newDate.toISOString(),
      }

      await dbUpdateLog({
        id: updatedLog.id,
        substance: updatedLog.substance,
        notes: updatedLog.notes || null,
        feelings: updatedLog.feelings ? JSON.stringify(updatedLog.feelings) : null,
        dosage: updatedLog.dosage ?? null,
        timestamp: updatedLog.timestamp,
      } as any)

      setLogs((s) => s.map((l) => (l.id === editingLogId ? updatedLog : l)))
      setEditingLogId(null)
      setEditingTimestamp('')
    } catch (err) {
      console.warn('Failed to save time', err)
    }
  }

  const cancelEditingTime = () => {
    setEditingLogId(null)
    setEditingTimestamp('')
  }

  // Trends UI state
  const [trendDays, setTrendDays] = useState<number | null>(30) // null = all time
  const [trendFilterSubstance, setTrendFilterSubstance] = useState<string | 'All'>('All')

  const usageOverTime = useMemo(() => {
    // when showing all substances we include all known options
    const subs = SUBSTANCE_OPTIONS
    return aggregateUsageOverTime((logs as any[]), trendDays, subs)
  }, [logs, trendDays])

  const frequencyCounts = useMemo(() => aggregateFrequencies((logs as any[]), trendDays), [logs, trendDays])

  const feelingsCounts = useMemo(() => aggregateFeelings((logs as any[]), trendDays, trendFilterSubstance), [logs, trendDays, trendFilterSubstance])

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
                    {editingLogId === log.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="datetime-local"
                          value={editingTimestamp}
                          onChange={(e) => setEditingTimestamp(e.target.value)}
                          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #11202b', background: '#07111a', color: 'var(--text)', width: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn primary"
                          onClick={saveEditedTime}
                          style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={cancelEditingTime}
                          style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        className="item-time"
                        onClick={() => startEditingTime(log)}
                        style={{ cursor: 'pointer' }}
                        title="Click to edit"
                      >
                        {formatDateTime(log.timestamp)}
                      </div>
                    )}
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

        {logs.length > 0 && ( /* Hide trends section when no data is available */
        <section>
          <div className="section-header">
            <h2>Trends</h2>
            <div className="muted">Breakdown by substance & feelings</div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div className="label" style={{ margin: 0 }}>Range</div>
                {[7, 30, 90].map((d) => (
                  <button key={d} className={trendDays === d ? 'btn primary' : 'btn ghost'} onClick={() => setTrendDays(d)}>
                    {d}d
                  </button>
                ))}
                <button className={trendDays === null ? 'btn primary' : 'btn ghost'} onClick={() => setTrendDays(null)}>
                  All
                </button>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="label" style={{ margin: 0 }}>Filter substance</div>
                <select value={trendFilterSubstance} onChange={(e) => setTrendFilterSubstance(e.target.value)}>
                  <option value="All">All</option>
                  {SUBSTANCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: '6px 0' }}>Usage over time</h3>
              <MultiLineChart labels={usageOverTime.labels} series={usageOverTime.series} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <h3 style={{ margin: '6px 0' }}>Frequencies</h3>
                <VerticalBarChart
                  items={Object.entries(frequencyCounts).map(([k, v]) => ({ label: k, value: v, color: defaultSubstanceColors[k] }))}
                />
              </div>

              <div>
                <h3 style={{ margin: '6px 0' }}>Emotional trends</h3>
                <HorizontalBarChart
                  items={Object.entries(feelingsCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => ({ label: k, value: v }))}
                />
              </div>
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  )
}
