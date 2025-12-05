import React, { useState } from 'react'
import { LogEntry, SUBSTANCE_OPTIONS, FEELING_OPTIONS, DOSAGE_OPTIONS, formatDateTime } from '../constants'

interface LogItemProps {
    log: LogEntry
    onUpdate: (log: LogEntry) => void
    onDelete: (id: string) => void
}

export function LogItem({ log, onUpdate, onDelete }: LogItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedLog, setEditedLog] = useState<LogEntry>(log)

    const handleStartEdit = () => {
        // Initialize editedLog with current log values
        // For timestamp, we need to format it for datetime-local input if we want to edit it there
        // But we store it as ISO string.
        setEditedLog({ ...log })
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditedLog(log)
    }

    const handleSave = () => {
        onUpdate(editedLog)
        setIsEditing(false)
    }

    const handleSubstanceChange = (substance: string) => {
        setEditedLog(prev => ({
            ...prev,
            substance,
            // Reset dosage if substance changes as options might change
            dosage: undefined
        }))
    }

    const toggleFeeling = (feeling: string) => {
        setEditedLog(prev => {
            const currentFeelings = prev.feelings || []
            const newFeelings = currentFeelings.includes(feeling)
                ? currentFeelings.filter(f => f !== feeling)
                : [...currentFeelings, feeling]
            return { ...prev, feelings: newFeelings.length ? newFeelings : undefined }
        })
    }

    // Helper to get datetime-local string from ISO
    const getDateTimeLocal = (iso: string) => {
        const date = new Date(iso)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        if (!val) return
        const date = new Date(val)
        setEditedLog(prev => ({ ...prev, timestamp: date.toISOString() }))
    }

    if (isEditing) {
        return (
            <li className="card item" style={{ flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Edit Entry</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn primary" onClick={handleSave} style={{ padding: '6px 12px' }}>Save</button>
                        <button type="button" className="btn ghost" onClick={handleCancelEdit} style={{ padding: '6px 12px' }}>Cancel</button>
                    </div>
                </div>

                <label>
                    <div className="label">Substance</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SUBSTANCE_OPTIONS.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => handleSubstanceChange(s)}
                                className={editedLog.substance === s ? 'pill selected substance-pill' : 'pill substance-pill'}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </label>

                <label>
                    <div className="label">Time</div>
                    <input
                        type="datetime-local"
                        value={getDateTimeLocal(editedLog.timestamp)}
                        onChange={handleTimeChange}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #333', background: '#07111a', color: 'var(--text)', width: '100%' }}
                    />
                </label>

                <label>
                    <div className="label">Dosage</div>
                    {editedLog.substance && DOSAGE_OPTIONS[editedLog.substance] ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            {DOSAGE_OPTIONS[editedLog.substance].map(option => (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => setEditedLog(prev => ({ ...prev, dosage: option.label }))}
                                    className={editedLog.dosage === option.label ? 'pill selected' : 'pill'}
                                    title={option.description}
                                >
                                    {option.label}
                                </button>
                            ))}
                            <input
                                type="text"
                                value={editedLog.dosage || ''}
                                onChange={e => setEditedLog(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="Custom dosage"
                                style={{ flex: 1, minWidth: '120px' }}
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={editedLog.dosage || ''}
                            onChange={e => setEditedLog(prev => ({ ...prev, dosage: e.target.value }))}
                            placeholder="Dosage (optional)"
                        />
                    )}
                </label>

                <label>
                    <div className="label">Feelings</div>
                    <div className="feelings-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {FEELING_OPTIONS.map(f => {
                            const selected = editedLog.feelings?.includes(f)
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => toggleFeeling(f)}
                                    className={selected ? 'pill selected feeling-pill' : 'pill feeling-pill'}
                                    style={{
                                        borderRadius: 999,
                                        border: selected ? '1px solid #333' : '1px solid #ccc',
                                        background: selected ? '#e6f0ff' : 'transparent',
                                        color: selected ? '#07111a' : undefined,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {f}
                                </button>
                            )
                        })}
                    </div>
                </label>

                <label>
                    <div className="label">Notes</div>
                    <textarea
                        value={editedLog.notes || ''}
                        onChange={e => setEditedLog(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder="Notes..."
                    />
                </label>
            </li>
        )
    }

    return (
        <li className="card item">
            <div className="item-head">
                <div className="item-title">{log.substance}</div>
                <div
                    className="item-time"
                    onClick={handleStartEdit}
                    style={{ cursor: 'pointer' }}
                    title="Click to edit"
                >
                    {formatDateTime(log.timestamp)}
                </div>
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

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn ghost" onClick={handleStartEdit} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>Edit</button>
                <button className="btn ghost" onClick={() => onDelete(log.id)} style={{ fontSize: '0.8rem', padding: '4px 8px', color: '#ff6b6b' }}>Delete</button>
            </div>
        </li>
    )
}
