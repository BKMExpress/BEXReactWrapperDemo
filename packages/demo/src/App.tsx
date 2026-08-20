import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BexError,
  BexFullSdk,
  type BexEnvironment,
  type PaymentSecurity,
  type PresentationStyle,
  type TransactionType,
} from 'bex-react-native';

const ENVIRONMENTS: BexEnvironment[] = ['dev', 'test', 'preprod', 'prod'];
const SECURITIES: PaymentSecurity[] = ['none', 'otp', 'tds'];
const STYLES: PresentationStyle[] = ['fullScreen', 'sheet'];
const TRANSACTION_TYPES: Exclude<TransactionType, 'recurring'>[] = [
  'sale',
  'preAuth',
];

function formatTransactionType(value: TransactionType): string {
  return value === 'preAuth' ? 'PRE_AUTH' : 'SALE';
}

function CycleChip<T extends string>({
  label,
  value,
  options,
  onChange,
  formatValue,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (next: T) => void;
  formatValue?: (value: T) => string;
}) {
  return (
    <Pressable
      style={styles.chip}
      onPress={() => {
        const index = options.indexOf(value);
        onChange(options[(index + 1) % options.length]);
      }}
    >
      <Text style={styles.chipLabel}>
        {label}: {formatValue ? formatValue(value) : value}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [gsmNo, setGsmNo] = useState('');
  const [merchantUserId, setMerchantUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [environment, setEnvironment] = useState<BexEnvironment>('dev');
  const [security, setSecurity] = useState<PaymentSecurity>('none');
  const [style, setStyle] = useState<PresentationStyle>('fullScreen');
  const [transactionType, setTransactionType] =
    useState<Exclude<TransactionType, 'recurring'>>('sale');
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [resultText, setResultText] = useState('Ready.');

  const canSubmit = useMemo(() => !busy, [busy]);

  const showResult = (value: unknown) => {
    setResultText(
      typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    );
  };

  const run = async (action: () => Promise<unknown>) => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await action();
      showResult(result);
    } catch (error) {
      const bexError = BexError.fromNative(error);
      showResult({
        error: true,
        code: bexError.code,
        message: bexError.message,
        title: bexError.title,
        nativeCode: bexError.nativeCode,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>BEX React Native Demo</Text>
        <Text style={styles.subtitle}>
          Consumes bex-react-native as a workspace dependency.
        </Text>

        <Field label="Auth token" value={authToken} onChangeText={setAuthToken} multiline />
        <Field label="Merchant ID" value={merchantId} onChangeText={setMerchantId} />
        <Field label="GSM" value={gsmNo} onChangeText={setGsmNo} />
        <Field
          label="Merchant user ID"
          value={merchantUserId}
          onChangeText={setMerchantUserId}
        />
        <Field label="Amount" value={amount} onChangeText={setAmount} />
        <Field label="Order ID" value={orderId} onChangeText={setOrderId} />

        <View style={styles.chipRow}>
          <CycleChip
            label="Env"
            value={environment}
            options={ENVIRONMENTS}
            onChange={setEnvironment}
          />
          <CycleChip
            label="Security"
            value={security}
            options={SECURITIES}
            onChange={setSecurity}
          />
          <CycleChip
            label="Style"
            value={style}
            options={STYLES}
            onChange={setStyle}
          />
          <CycleChip
            label="TxnType"
            value={transactionType}
            options={TRANSACTION_TYPES}
            onChange={setTransactionType}
            formatValue={formatTransactionType}
          />
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Initialize"
            disabled={!canSubmit}
            onPress={() =>
              run(async () => {
                const result = await BexFullSdk.initialize({
                  authToken,
                  merchantId,
                  merchantUserId,
                  gsmNo,
                  environment,
                  currencyCode: 'TRY',
                  transactionType,
                });
                setInitialized(true);
                return result;
              })
            }
          />
          <ActionButton
            label="Pay"
            disabled={!canSubmit || !initialized}
            onPress={() =>
              run(() =>
                BexFullSdk.pay(
                  {
                    amount: Number(amount),
                    orderId,
                    security,
                    installmentCount: 1,
                    currency: 'TRY',
                    transactionType,
                    successUrl:
                      'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/success',
                    failUrl:
                      'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/fail',
                  },
                  { style }
                )
              )
            }
          />
          <ActionButton
            label="Select card"
            disabled={!canSubmit || !initialized}
            onPress={() =>
              run(() =>
                BexFullSdk.selectCard(
                  {
                    amount: Number(amount),
                    orderId,
                    security,
                    installmentCount: 1,
                    currency: 'TRY',
                    transactionType,
                    successUrl:
                      'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/success',
                    failUrl:
                      'https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/fail',
                  },
                  { style }
                )
              )
            }
          />
        </View>

        {busy ? <ActivityIndicator style={styles.spinner} /> : null}

        <Text style={styles.resultLabel}>Result</Text>
        <Text style={styles.result}>{resultText}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
      />
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F4EF',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1A17',
  },
  subtitle: {
    fontSize: 14,
    color: '#5C564C',
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3F3A34',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9D2C7',
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1C1A17',
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#E8E1D6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipLabel: {
    color: '#1C1A17',
    fontWeight: '600',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0F6E56',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  spinner: {
    marginTop: 8,
  },
  resultLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#3F3A34',
  },
  result: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#1C1A17',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#D9D2C7',
    borderRadius: 10,
    padding: 12,
    overflow: 'hidden',
  },
});
