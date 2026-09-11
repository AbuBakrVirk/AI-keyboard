import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a short, URL-safe request ID.
 * Uses the first 8 characters of a UUID (enough uniqueness for log correlation).
 */
export function generateRequestId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}
