/**
 * @fileoverview Main entry point for @seriously-ai/shared package
 * 
 * This file re-exports all types, utilities, and components from the shared package
 * to provide a clean API for consumers.
 */

// Export all types
export type {
  User,
  Insight,
} from './types';

// Export database types
export type { Database } from './types/database';

// Export auth utilities
export * from './lib/auth';

// Export all utilities
export {
  formatDate,
  formatRelativeDate,
  isValidEmail,
  capitalizeWords,
  truncateString,
  generateUUID,
  debounce,
  deepClone,
  formatCurrency,
  formatNumber,
} from './utils';

// Re-export everything from types and utils for convenience
export * from './types';
export * from './utils'; 