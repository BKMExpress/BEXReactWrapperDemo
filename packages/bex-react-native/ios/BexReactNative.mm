#import "BexReactNative.h"

@interface BexFullSdkBridge : NSObject
+ (instancetype)shared;
- (void)initialize:(NSDictionary *)config
          resolver:(void (^)(id _Nullable))resolve
          rejecter:(void (^)(NSString *, NSString *, NSError * _Nullable))reject;
- (void)pay:(NSDictionary *)payment
    options:(NSDictionary *)options
   resolver:(void (^)(id _Nullable))resolve
   rejecter:(void (^)(NSString *, NSString *, NSError * _Nullable))reject;
- (void)selectCard:(NSDictionary *)options
          resolver:(void (^)(id _Nullable))resolve
          rejecter:(void (^)(NSString *, NSString *, NSError * _Nullable))reject;
@end

@implementation BexReactNative

- (void)initialize:(NSDictionary *)config
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [[BexFullSdkBridge shared] initialize:config resolver:resolve rejecter:reject];
}

- (void)pay:(NSDictionary *)payment
    options:(NSDictionary *)options
    resolve:(RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject
{
  [[BexFullSdkBridge shared] pay:payment options:options resolver:resolve rejecter:reject];
}

- (void)selectCard:(NSDictionary *)options
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [[BexFullSdkBridge shared] selectCard:options resolver:resolve rejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBexReactNativeSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"BexReactNative";
}

@end
