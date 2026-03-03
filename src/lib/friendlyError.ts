// src/lib/friendlyError.ts

/**
 * Returns a user-friendly error message from an error object.
 * Maps Firebase and Firestore error codes to readable messages.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';

  if (typeof error === 'string') return error;

  // Handle Firebase/Firestore error objects
  if (error instanceof Error) {
    const errorCode = (error as any).code;
    const errorMessage = error.message || '';

    // Firebase Authentication errors
    if (errorCode === 'auth/user-not-found') {
      return 'Email not found. Please check and try again.';
    }
    if (errorCode === 'auth/wrong-password') {
      return 'Incorrect password. Please try again.';
    }
    if (errorCode === 'auth/email-already-in-use') {
      return 'This email is already registered. Please log in instead.';
    }
    if (errorCode === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    }
    if (errorCode === 'auth/invalid-email') {
      return 'Invalid email address. Please check and try again.';
    }
    if (errorCode === 'auth/operation-not-allowed') {
      return 'This operation is not available right now. Please try again later.';
    }
    if (errorCode === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    }
    if (errorCode === 'auth/network-request-failed') {
      return 'Network error. Please check your connection and try again.';
    }

    // Firestore errors
    if (errorCode === 'permission-denied') {
      return 'You do not have permission to perform this action.';
    }
    if (errorCode === 'not-found') {
      return 'We could not find what you were looking for.';
    }
    if (errorCode === 'already-exists') {
      return 'This item already exists.';
    }
    if (errorCode === 'failed-precondition') {
      return 'Something is not set up correctly. Please try again.';
    }
    if (errorCode === 'unauthenticated') {
      return 'Please log in to continue.';
    }
    if (errorCode === 'unavailable' || errorCode === 'network-error') {
      return 'Network error. Please check your connection and try again.';
    }
    if (errorCode === 'invalid-argument') {
      return 'Invalid information. Please check your details and try again.';
    }
    if (errorCode === 'deadline-exceeded') {
      return 'Request took too long. Please try again.';
    }

    // Return the error message if it doesn't contain Firebase internals
    if (errorMessage && !errorMessage.includes('Firebase') && !errorMessage.includes('firestore')) {
      return errorMessage;
    }
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if ('message' in err && typeof err.message === 'string') {
      const msg = err.message;
      if (!msg.includes('Firebase') && !msg.includes('firestore')) {
        return msg;
      }
    }
    if ('code' in err && typeof err.code === 'string') {
      return getFriendlyErrorMessage(new Error(err.code));
    }
  }

  return 'Something went wrong. Please try again.';
}
