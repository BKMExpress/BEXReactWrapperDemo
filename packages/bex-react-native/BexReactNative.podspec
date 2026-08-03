require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

BKM_IOS_SDK_VERSION = "1.0.7" unless defined?(BKM_IOS_SDK_VERSION)
BKM_IOS_SDK_URL = "https://entegrasyon-repo.bkmexpress.com.tr/repository/swift/iossdk/ios_full_sdk/#{BKM_IOS_SDK_VERSION}.zip" unless defined?(BKM_IOS_SDK_URL)

Pod::Spec.new do |s|
  s.name         = "BexReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => "https://github.com/BKMExpress/bkm-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "5.9"
  s.static_framework = true

  # Download the official BKM Express XCFramework on pod install (not vendored in git).
  s.prepare_command = <<-CMD
    set -e
    FRAMEWORKS_DIR="ios/Frameworks"
    mkdir -p "$FRAMEWORKS_DIR"
    if [ ! -d "$FRAMEWORKS_DIR/BKMExpressSDK.xcframework" ]; then
      TMP_ZIP="$(mktemp -t bkm-ios-sdk).zip"
      TMP_DIR="$(mktemp -d -t bkm-ios-sdk)"
      curl -fsSL "#{BKM_IOS_SDK_URL}" -o "$TMP_ZIP"
      unzip -qo "$TMP_ZIP" -d "$TMP_DIR"
      FOUND="$(find "$TMP_DIR" -type d -name 'BKMExpressSDK.xcframework' | head -n 1)"
      if [ -z "$FOUND" ]; then
        echo "BKMExpressSDK.xcframework not found in SDK archive" >&2
        exit 1
      fi
      rm -rf "$FRAMEWORKS_DIR/BKMExpressSDK.xcframework"
      mv "$FOUND" "$FRAMEWORKS_DIR/BKMExpressSDK.xcframework"
      rm -rf "$TMP_ZIP" "$TMP_DIR"
    fi
  CMD

  s.vendored_frameworks = "ios/Frameworks/BKMExpressSDK.xcframework"
  s.frameworks = "UIKit", "Foundation"

  install_modules_dependencies(s)
end
