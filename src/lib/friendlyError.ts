// src/lib/friendlyError.ts
// Maps known error codes/messages to user-friendly explanations

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  // Firebase/Firestore errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    // @ts-ignore
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'unavailable':
        return 'The service is temporarily unavailable. Please try again later.';
      case 'not-found':
        return 'The requested resource was not found.';
      // Add more Firebase/Firestore codes as needed
    }
  }

  // Stripe/payment errors
  if (typeof error === 'object' && error !== null && 'message' in error) {
    // @ts-ignore
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('card was declined')) return 'Your card was declined. Please use a different payment method.';
    if (msg.includes('insufficient funds')) return 'Your card has insufficient funds.';
    if (msg.includes('expired card')) return 'Your card has expired.';
    if (msg.includes('incorrect cvc')) return 'The CVC code is incorrect.';
    if (msg.includes('payment method')) return 'There was a problem with your payment method.';
    if (msg.includes('network')) return 'A network error occurred. Please check your connection and try again.';
    if (msg.includes('timeout')) return 'The request timed out. Please try again.';
    if (msg.includes('permission')) return 'You do not have permission to perform this action.';
    if (msg.includes('auth')) return 'You must be signed in to perform this action.';
    if (msg.includes('offline')) return 'You appear to be offline. Please check your connection.';
    if (msg.includes('connect')) return 'Could not connect to the server. Please try again.';
    if (msg.includes('stripe')) return 'There was a problem processing your payment. Please try again.';
    if (msg.includes('payment')) return 'There was a problem processing your payment.';
  }

  // Fallback: show the error message if it is not technical
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    // Hide technical errors
    if (/firebase|firestore|auth|stripe|network|timeout|permission|offline|connect|error|exception|stack|debug|trace|internal|server/i.test(error.message)) {
      return 'Something went wrong. Please try again.';
    }
    return error.message;
  }

  // Fallback for string errors
  if (typeof error === 'string') {
    if (/firebase|firestore|auth|stripe|network|timeout|permission|offline|connect|error|exception|stack|debug|trace|internal|server/i.test(error)) {
      return 'Something went wrong. Please try again.';
    }
    return error;
  }

  return 'An unknown error occurred.';
}
