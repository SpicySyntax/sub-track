export interface LogEntry {
    id: string
    substance: string
    notes: string
    feelings?: string[]
    dosage?: string
    timestamp: string // ISO string for storage
}

export const SUBSTANCE_OPTIONS = [
    'Marijuana',
    'Alcohol',
    'Nicotine',
]

export const FEELING_OPTIONS = ['bored', 'tired', 'stressed', 'energized', 'angry', 'happy', 'anxious', 'in-pain', 'neutral', 'lonely', 'relaxed', 'sad']

export const DOSAGE_OPTIONS: Record<string, { label: string; description: string }[]> = {
    Marijuana: [
        { label: '1mg', description: 'Micro (edible)' },
        { label: '2.5mg', description: 'Micro (edible)' },
        { label: '5mg', description: 'Light (edible)' },
        { label: '7.5mg', description: 'Standard (edible)' },
        { label: '10mg', description: 'Standard (edible)' },
        { label: '20mg', description: 'Strong (edible)' },
        { label: '1 hit', description: 'Single hit (concentrate)' },
        { label: '2 hits', description: '2 hits (concentrate)' },
        { label: '3 hits', description: '3 hits (concentrate)' },
    ],
    Alcohol: [
        { label: '1 drink', description: 'Single standard drink' },
        { label: '2 drinks', description: 'Two standard drinks' },
        { label: '3 drinks', description: 'Three standard drinks' },
        { label: '4 drinks', description: 'Four standard drinks' },

    ],
    Nicotine: [
        { label: '3mg', description: 'oral Nicotine' },
        { label: '6mg', description: 'oral Nicotine' },
        { label: '1 cigarette', description: 'Single cigarette' },
    ],
}

export const DOSAGE_WEIGHTS: Record<string, number> = {
    // Marijuana - aiming for roughly mg equivalence
    // For inhalation, 1 hit is roughly estimated. 
    // This is purely relative for the chart.
    '1mg': 1,
    '2.5mg': 2.5,
    '5mg': 5,
    '7.5mg': 7.5,
    '10mg': 10,
    '20mg': 20,
    '1 hit': 8,
    '2 hits': 16,
    '3 hits': 24,

    // Alcohol - units of standard drinks
    '1 drink': 1,
    '2 drinks': 2,
    '3 drinks': 3,
    '4 drinks': 4,

    // Nicotine - units of cigarettes/strength
    '3mg': 3,
    '6mg': 6,
    '1 cigarette': 2,
}

export const defaultSubstanceColors: Record<string, string> = {
    Marijuana: '#8bd99b',
    Alcohol: '#ff8b8b',
    Nicotine: '#bdbdf6',
}

export const formatDateTime = (iso: string): string => {
    const date = new Date(iso)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(date)
}
