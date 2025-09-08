// Core domain types for Beerfest app

export type Category = 'look' | 'aroma' | 'flavour' | 'mouthfeel' | 'finish'

export interface Event {
  id: string
  code: string
  name: string
  hostId: string
  createdAt: number
  status: 'active' | 'ended'
  beerOrder: string[]
}

export interface Attendee {
  id: string
  name: string
  isHost: boolean
  joinedAt: number
}

export interface Beer {
  id: string
  eventId: string
  name: string
  brewery: string
  style: string
  broughtByAttendeeId: string
  orderIndex?: number
  tasted: boolean
  photoUrl?: string
}

export interface Score {
  id: string
  eventId: string
  beerId: string
  attendeeId: string
  values: Record<Category, number>
  total: number
  updatedAt: number
}

export interface EventAggregates {
  eventId: string
  revealed: boolean
}

export const CATEGORIES: Category[] = ['look', 'aroma', 'flavour', 'mouthfeel', 'finish']

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(5, Math.floor(value)))
}

export function computeTotal(values: Record<Category, number>): number {
  return CATEGORIES.reduce((sum, c) => sum + clampScore(values[c] ?? 0), 0)
}


