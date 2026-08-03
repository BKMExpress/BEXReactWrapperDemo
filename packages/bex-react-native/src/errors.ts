import type { BexErrorCode } from './types';

export class BexError extends Error {
  readonly code: BexErrorCode;
  readonly title?: string;
  readonly nativeCode?: number;
  readonly reason?: string;

  constructor(
    code: BexErrorCode,
    message: string,
    options?: { title?: string; nativeCode?: number; reason?: string }
  ) {
    super(message);
    this.name = 'BexError';
    this.code = code;
    this.title = options?.title;
    this.nativeCode = options?.nativeCode;
    this.reason = options?.reason;
  }

  static fromNative(error: unknown): BexError {
    if (error instanceof BexError) {
      return error;
    }

    if (error && typeof error === 'object') {
      const record = error as Record<string, unknown>;
      const userInfo =
        record.userInfo && typeof record.userInfo === 'object'
          ? (record.userInfo as Record<string, unknown>)
          : undefined;

      const code =
        (userInfo?.code as BexErrorCode) ||
        (record.code as BexErrorCode) ||
        'unknown';
      const message =
        (typeof userInfo?.message === 'string' && userInfo.message) ||
        (typeof record.message === 'string' && record.message) ||
        'An unknown BEX SDK error occurred.';

      return new BexError(code, message, {
        title:
          typeof userInfo?.title === 'string'
            ? userInfo.title
            : typeof record.title === 'string'
              ? record.title
              : undefined,
        nativeCode:
          typeof userInfo?.nativeCode === 'number'
            ? userInfo.nativeCode
            : typeof record.nativeCode === 'number'
              ? record.nativeCode
              : undefined,
        reason:
          typeof userInfo?.reason === 'string'
            ? userInfo.reason
            : typeof record.reason === 'string'
              ? record.reason
              : undefined,
      });
    }

    if (typeof error === 'string') {
      return new BexError('unknown', error);
    }

    return new BexError('unknown', 'An unknown BEX SDK error occurred.');
  }
}
