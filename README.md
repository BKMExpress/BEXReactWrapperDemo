# bkm-react-native

BKM Express React Native wrapper için monorepo.

```
packages/
  bex-react-native/   # yayınlanan paket
  demo/               # örnek uygulama
```

Entegrasyon ve kullanım dokümanı: [`packages/bex-react-native/README.md`](packages/bex-react-native/README.md)

## Local geliştirmeler için

```bash
yarn
yarn prepare:lib
yarn workspace bex-react-native-demo start
yarn workspace bex-react-native-demo android
yarn workspace bex-react-native-demo ios
```
