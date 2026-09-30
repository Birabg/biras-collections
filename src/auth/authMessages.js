import { AUTH_ERRORS } from './authService';

/**
 * Maps machine error codes to human copy.
 * Technical/backend text must never reach the user, so anything unmapped
 * falls back to a calm, generic message.
 */
const MESSAGES = {
  [AUTH_ERRORS.INVALID_CREDENTIALS]: {
    title: 'Those details did not match',
    body: 'Check the email address and password, then try again.',
  },
  [AUTH_ERRORS.EMAIL_TAKEN]: {
    title: 'That email is already registered',
    body: 'Try signing in instead, or reset the password if you have forgotten it.',
  },
  [AUTH_ERRORS.EMAIL_INVALID]: {
    title: 'Enter a valid email address',
    body: 'Use the format name@example.com.',
  },
  [AUTH_ERRORS.WEAK_PASSWORD]: {
    title: 'Choose a stronger password',
    body: 'Use at least 8 characters, including a number.',
  },
  [AUTH_ERRORS.TERMS_NOT_ACCEPTED]: {
    title: 'Please accept the terms',
    body: 'You need to accept the terms and privacy policy to create an account.',
  },
  [AUTH_ERRORS.ACCOUNT_LOCKED]: {
    title: 'This account is disabled',
    body: 'Please contact support and we will help you get back in.',
  },
  [AUTH_ERRORS.SESSION_EXPIRED]: {
    title: 'Your session has expired',
    body: 'For your security, please sign in again to continue.',
  },
  [AUTH_ERRORS.INVALID_RESET_TOKEN]: {
    title: 'This reset link is no longer valid',
    body: 'Reset links can only be used once and expire after a short time. Request a new one.',
  },
  [AUTH_ERRORS.RATE_LIMITED]: {
    title: 'Too many attempts',
    body: 'Please wait a moment before trying again.',
  },
  [AUTH_ERRORS.NETWORK]: {
    title: 'We could not reach the server',
    body: 'Check your connection and try again.',
  },
};

const FALLBACK = {
  title: 'Something went wrong',
  body: 'We could not complete that request. Please try again.',
};

/** Never throws — always returns presentable copy. */
export function authErrorCopy(error) {
  if (!error) return null;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return FALLBACK;
}

/** Field-level copy, used to attach a message to the right input. */
export function authFieldError(code, field) {
  if (code === AUTH_ERRORS.EMAIL_TAKEN && field === 'email') return 'This email is already registered.';
  if (code === AUTH_ERRORS.EMAIL_INVALID && field === 'email') return 'Enter a valid email address.';
  if (code === AUTH_ERRORS.WEAK_PASSWORD && field === 'password') return 'Use at least 8 characters.';
  if (code === AUTH_ERRORS.INVALID_CREDENTIALS && field === 'password') return 'This password is not correct.';
  return undefined;
}
