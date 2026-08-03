import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  initialize(config: Object): Promise<Object>;
  pay(payment: Object, options: Object): Promise<Object>;
  selectCard(options: Object): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BexReactNative');
