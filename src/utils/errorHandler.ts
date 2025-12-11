/**
 * Centralized error handling utility
 */

import log from './log';
import type { CreateAlertFunction } from '../types';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handle errors consistently across the application
 */
export function handleError(
  error: unknown,
  context: string,
  createAlert?: CreateAlertFunction
): void {
  log.error(`[${context}]`, error);

  let userMessage = 'An unexpected error occurred';

  if (error instanceof AppError) {
    userMessage = error.userMessage || error.message;
  } else if (error instanceof Error) {
    userMessage = error.message;
  } else if (typeof error === 'string') {
    userMessage = error;
  }

  createAlert?.(userMessage, 'error');
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  createAlert?: CreateAlertFunction
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, createAlert);
      throw error;
    }
  }) as T;
}
