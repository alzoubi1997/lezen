import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateHandle(prefix?: string): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  const prefixPart = prefix ? prefix.toUpperCase().slice(0, 4) : 'USER'
  return `${prefixPart}-${randomNum}`
}

export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

export function formatTime(seconds: number): string {
  // Handle invalid/placeholder values
  if (seconds < 0 || seconds > 999999) {
    return '--:--'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    // For times over 1 hour, show hours:minutes format (e.g., "1:40" for 1 hour 40 minutes)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }
  // For times under 1 hour, show minutes:seconds format (e.g., "40:00" for 40 minutes)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}u ${minutes}m`
  }
  return `${minutes}m`
}

