import NativeBexReactNative from './NativeBexReactNative';
import { BexError } from './errors';
import type {
  FlowOptions,
  InitializeConfig,
  InitializeResult,
  PayResult,
  PaymentData,
  SelectCardResult,
} from './types';

function createTransactionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  // RFC4122-ish fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function assertInitializeConfig(config: InitializeConfig): void {
  if (!config?.authToken?.trim()) {
    throw new BexError('invalid_argument', 'authToken is required.');
  }
  if (!config.merchantId?.trim()) {
    throw new BexError('invalid_argument', 'merchantId is required.');
  }
  if (!config.merchantUserId?.trim()) {
    throw new BexError('invalid_argument', 'merchantUserId is required.');
  }
  if (!config.gsmNo?.trim()) {
    throw new BexError('invalid_argument', 'gsmNo is required.');
  }
  if (!config.environment) {
    throw new BexError('invalid_argument', 'environment is required.');
  }
}

function assertPaymentData(payment: PaymentData): void {
  if (typeof payment?.amount !== 'number' || Number.isNaN(payment.amount)) {
    throw new BexError('invalid_argument', 'amount must be a number.');
  }
  if (!payment.orderId?.trim()) {
    throw new BexError('invalid_argument', 'orderId is required.');
  }
  if (!payment.security) {
    throw new BexError('invalid_argument', 'security is required.');
  }
  if (
    typeof payment.installmentCount !== 'number' ||
    payment.installmentCount < 1
  ) {
    throw new BexError(
      'invalid_argument',
      'installmentCount must be a positive integer.'
    );
  }
}

async function withNativeError<T>(operation: () => Promise<Object>): Promise<T> {
  try {
    return (await operation()) as T;
  } catch (error) {
    throw BexError.fromNative(error);
  }
}

export const BexFullSdk = {
  async initialize(config: InitializeConfig): Promise<InitializeResult> {
    assertInitializeConfig(config);
    return withNativeError(() =>
      NativeBexReactNative.initialize(config)
    );
  },

  async pay(
    payment: PaymentData,
    options: FlowOptions = {}
  ): Promise<PayResult> {
    assertPaymentData(payment);
    const payload: PaymentData = {
      ...payment,
      transactionId: payment.transactionId?.trim() || createTransactionId(),
      transactionDate:
        payment.transactionDate?.trim() || String(Date.now()),
      currency: payment.currency?.trim() || 'TRY',
      transactionType: payment.transactionType || 'sale',
      successUrl: payment.successUrl || '',
      failUrl: payment.failUrl || '',
    };

    return withNativeError(() =>
      NativeBexReactNative.pay(payload, {
        style: options.style || 'fullScreen',
        theme: options.theme,
        extras: options.extras,
      })
    );
  },

  async selectCard(
    paymentOrOptions: PaymentData | FlowOptions = {},
    options: FlowOptions = {}
  ): Promise<SelectCardResult> {
    const looksLikePayment =
      paymentOrOptions != null &&
      typeof paymentOrOptions === 'object' &&
      ('amount' in paymentOrOptions ||
        'orderId' in paymentOrOptions ||
        'security' in paymentOrOptions ||
        'installmentCount' in paymentOrOptions);

    const payment = (looksLikePayment ? paymentOrOptions : {}) as Partial<PaymentData>;
    const flowOptions = (looksLikePayment ? options : paymentOrOptions) as FlowOptions;

    const payload = {
      amount: typeof payment.amount === 'number' ? payment.amount : 100,
      orderId: payment.orderId?.trim() || `DEMO-${Date.now()}`,
      security: payment.security || 'none',
      installmentCount:
        typeof payment.installmentCount === 'number' ? payment.installmentCount : 1,
      currency: payment.currency?.trim() || 'TRY',
      transactionType: payment.transactionType || 'sale',
      transactionId: payment.transactionId?.trim() || createTransactionId(),
      transactionDate: payment.transactionDate?.trim() || String(Date.now()),
      successUrl:
        payment.successUrl ||
        'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/success',
      failUrl:
        payment.failUrl || 'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/fail',
    };

    return withNativeError(() =>
      NativeBexReactNative.selectCard({
        style: flowOptions.style || 'fullScreen',
        theme: flowOptions.theme,
        extras: flowOptions.extras,
        payment: payload,
      })
    );
  },
};

export default BexFullSdk;
