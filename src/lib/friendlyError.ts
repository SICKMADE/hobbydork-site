// src/lib/friendlyError.ts

/**
 * Returns a user-friendly error message from an error object.
 * Falls back to a generic message if the error is not recognized.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    // Optionally, map specific error messages to friendlier ones here
    return error.message || 'An unknown error occurred.';
  }

  if (typeof error === 'object' && error !== null) {
    // Firebase/Firestore errors
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    if ('code' in error && typeof (error as any).code === 'string') {
      // Optionally, map error codes to friendly messages
      return `Error: ${(error as any).code}`;
    }
  }

  return 'An unknown error occurred.';
}
