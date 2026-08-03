export type BexEnvironment = 'dev' | 'test' | 'preprod' | 'prod';

export type PaymentSecurity = 'tds' | 'otp' | 'none';

export type TransactionType = 'sale' | 'preAuth' | 'recurring';

export type PresentationStyle = 'sheet' | 'fullScreen';

export type BexErrorCode =
  | 'network'
  | 'cancelled'
  | 'unauthorized'
  | 'api'
  | 'session'
  | 'encryption'
  | 'server'
  | 'unknown'
  | 'not_initialized'
  | 'already_in_progress'
  | 'invalid_argument'
  | 'no_activity';

export interface BexThemeColors {
  primary?: string;
  primaryVariant?: string;
  background?: string;
  surface?: string;
  textPrimary?: string;
  textSecondary?: string;
  textOnPrimary?: string;
  buttonPrimary?: string;
  buttonPrimaryText?: string;
  buttonSecondaryBorder?: string;
  buttonSecondaryText?: string;
  buttonDisabled?: string;
  success?: string;
  error?: string;
  warning?: string;
  border?: string;
  divider?: string;
  /** iOS tint color (falls back to primary when omitted). */
  tint?: string;
}

export interface BexTheme {
  colors?: BexThemeColors;
  /** Button corner radius in density-independent pixels. */
  buttonCornerRadius?: number;
  buttonBorderWidth?: number;
  /** When true on iOS, uses capsule button corners. */
  buttonCapsule?: boolean;
}

export interface InitializeConfig {
  authToken: string;
  merchantId: string;
  merchantUserId: string;
  gsmNo: string;
  environment: BexEnvironment;
  /** ISO 4217 currency. Required for iOS initialize; default for Android pay. */
  currencyCode?: string;
  /** Used by iOS initialize (required by native SDK). Defaults to sale. */
  transactionType?: TransactionType;
  /** Used by iOS initialize (required by native SDK). Defaults to 1. */
  installmentCount?: number;
  theme?: BexTheme;
  /** Android-only. Ignored on iOS. */
  troySonicSoundEnabled?: boolean;
  /** Forward-compatible native flags. Unstable. */
  extras?: Record<string, unknown>;
}

export interface PaymentData {
  amount: number;
  orderId: string;
  security: PaymentSecurity;
  installmentCount: number;
  currency?: string;
  transactionType?: TransactionType;
  /** Auto-generated UUID when omitted. */
  transactionId?: string;
  transactionDate?: string;
  successUrl?: string;
  failUrl?: string;
  extras?: Record<string, unknown>;
}

export interface FlowOptions {
  style?: PresentationStyle;
  theme?: BexTheme;
  extras?: Record<string, unknown>;
}

export interface BexBankInformation {
  cardType: string;
  cardBrandType: string;
  cardBrand: string;
  bankShortName: string;
  bankCode?: string;
  cardScheme?: string;
}

export interface BexCard {
  cardId: string;
  maskCardNumber: string;
  cardAlias?: string | null;
  binValue?: string | null;
  imageUrl?: string | null;
  bankInformation: BexBankInformation;
  active?: boolean;
}

export type PayResult =
  | {
      status: 'completed';
      transactionId: string;
      amount: number;
      cardNumber?: string | null;
    }
  | {
      status: 'cancelled';
    };

export type SelectCardResult =
  | {
      status: 'selected';
      card: BexCard;
    }
  | {
      status: 'cancelled';
    };

export interface InitializeResult {
  ok: true;
}
