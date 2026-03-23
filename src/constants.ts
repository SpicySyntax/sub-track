export interface LogEntry {
    id: string
    substance: string
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

export const DOSAGE_OPTIONS: Record<string, { label: string; description: string; weight: number }[]> = {
    Marijuana: [
        { label: '1mg', description: 'Micro (edible)', weight: 1 },
        { label: '2.5mg', description: 'Micro (edible)', weight: 2.5 },
        { label: '5mg', description: 'Light (edible)', weight: 5 },
        { label: '7.5mg', description: 'Standard (edible)', weight: 7.5 },
        { label: '10mg', description: 'Standard (edible)', weight: 10 },
        { label: '20mg', description: 'Strong (edible)', weight: 20 },
        { label: '1 hit', description: 'Single hit (concentrate)', weight: 8 },
        { label: '2 hits', description: '2 hits (concentrate)', weight: 16 },
        { label: '3 hits', description: '3 hits (concentrate)', weight: 24 },
    ],
    Alcohol: [
        { label: '1 drink', description: 'Single standard drink', weight: 1 },
        { label: '2 drinks', description: 'Two standard drinks', weight: 2 },
        { label: '3 drinks', description: 'Three standard drinks', weight: 3 },
        { label: '4 drinks', description: 'Four standard drinks', weight: 4 },

    ],
    Nicotine: [
        { label: '2mg', description: 'oral Nicotine', weight: 2 },
        { label: '3mg', description: 'oral Nicotine', weight: 3 },
        { label: '4mg', description: 'oral Nicotine', weight: 4 },
        { label: '6mg', description: 'oral Nicotine', weight: 6 },
        { label: '1 cigarette', description: 'Single cigarette', weight: 2 },
    ],
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
