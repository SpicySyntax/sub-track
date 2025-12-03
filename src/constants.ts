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
    'Caffeine',
    'Alcohol',
    'Nicotine',
]

export const FEELING_OPTIONS = ['bored', 'tired', 'stressed', 'energized', 'angry', 'happy', 'sad', 'anxious', 'in-pain']

export const DOSAGE_OPTIONS: Record<string, { label: string; description: string }[]> = {
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

export const defaultSubstanceColors: Record<string, string> = {
    Marijuana: '#8bd99b',
    Caffeine: '#ffd166',
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
