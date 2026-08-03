# bex-react-native

BKM Express Full SDK için React Native wrapper (Android + iOS).

## Gereksinimler

- **New Architecture** açık React Native
- Android: minSdk 24, compileSdk 36+, AGP 8.9.1+
- iOS: 15.0+

## Kurulum

Paket reposu:

`https://entegrasyon-repo.bkmexpress.com.tr/repository/npm/`

```bash
npm install bex-react-native --registry https://entegrasyon-repo.bkmexpress.com.tr/repository/npm/
# veya
yarn add bex-react-native --registry https://entegrasyon-repo.bkmexpress.com.tr/repository/npm/
```

Ya da `.npmrc` içinde registry’yi tek seferlik tanımlayın:

```ini
registry=https://entegrasyon-repo.bkmexpress.com.tr/repository/npm/
```

Ardından:

```bash
npm install bex-react-native
# veya
yarn add bex-react-native
```

### Android

`android/build.gradle` dosyasına BKM Express Maven reposunu ekleyin:

```gradle
allprojects {
  repositories {
    maven {
      url = uri("https://entegrasyon-repo.bkmexpress.com.tr/repository/bkm-mobil-sdk/")
    }
  }
}
```

### iOS

```bash
cd ios && pod install
```

`pod install` BKM Express XCFramework’ünü otomatik indirir.

## Kullanım

```ts
import { BexFullSdk, BexError } from 'bex-react-native';

// 1) Bir kez initialize edin
await BexFullSdk.initialize({
  authToken: '...',
  merchantId: '...',
  merchantUserId: '...',
  gsmNo: '5XXXXXXXXX',
  environment: 'dev', // 'dev' | 'test' | 'preprod' | 'prod'
  currencyCode: 'TRY',
});

// 2) Ödeme
const payResult = await BexFullSdk.pay(
  {
    amount: 100,
    orderId: 'ORDER_123',
    security: 'none', // 'none' | 'otp' | 'tds'
    installmentCount: 1,
    currency: 'TRY',
    transactionType: 'sale',
    successUrl: 'https://merchant.example.com/success',
    failUrl: 'https://merchant.example.com/fail',
  },
  { style: 'fullScreen' } // 'fullScreen' | 'sheet'
);

if (payResult.status === 'completed') {
  // payResult.transactionId, payResult.amount
}

// 3) Kart seçimi
const cardResult = await BexFullSdk.selectCard(
  {
    amount: 100,
    orderId: 'ORDER_123',
    security: 'none',
    installmentCount: 1,
    currency: 'TRY',
  },
  { style: 'fullScreen' }
);

if (cardResult.status === 'selected') {
  // cardResult.card
}
```

İptal durumunda `{ status: 'cancelled' }` döner. Hatalar `BexError` fırlatır.

```ts
try {
  await BexFullSdk.pay({ ... });
} catch (error) {
  const bexError = BexError.fromNative(error);
  // bexError.code, bexError.message
}
```

## API

- `BexFullSdk.initialize(config)`
- `BexFullSdk.pay(payment, options?)`
- `BexFullSdk.selectCard(payment?, options?)`
- `BexError`

## Native SDK sürümleri (0.1.0)

| Platform | Bağımlılık |
|----------|------------|
| Android | `com.bkm.mobil:full-sdk:0.0.5` |
| iOS | XCFramework `1.0.7` |
