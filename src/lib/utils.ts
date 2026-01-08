import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Used throughout the app for conditional className logic
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100) // Stripe amounts are in cents
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/**
 * Get risk level color for UI display
 */
export function getRiskColor(riskLevel: string | null): string {
  switch (riskLevel?.toLowerCase()) {
    case 'low':
      return 'green'
    case 'medium':
      return 'yellow'
    case 'high':
      return 'orange'
    case 'critical':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Get status badge color for UI display
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'complete':
      return 'green'
    case 'pending':
      return 'yellow'
    case 'error':
      return 'red'
    case 'active':
      return 'green'
    case 'inactive':
    case 'suspended':
      return 'red'
    default:
      return 'gray'
  }
}