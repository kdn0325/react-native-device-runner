export interface DeviceConfig {
  iosScheme?: string | undefined;
  iosConfiguration?: string | undefined;
  iosWorkspace?: string | undefined;
  iosDerivedData?: string | undefined;
  iosBundleId?: string | undefined;
  androidAppId?: string | undefined;
  androidModule?: string | undefined;
  androidVariant?: string | undefined;
}

export interface DeviceInfo {
  udid?: string | undefined;
  serial?: string | undefined;
  platform: 'ios' | 'android';
  name?: string | undefined;
}

export interface ExpoConfig {
  ios?: {
    bundleIdentifier?: string;
  };
  android?: {
    package?: string;
  };
  extra?: {
    IOS_SCHEME?: string;
    IOS_CONFIGURATION?: string;
    IOS_WORKSPACE?: string;
    IOS_DERIVED_DATA?: string;
    AOS_APP_ID?: string;
    AOS_MODULE?: string;
    AOS_VARIANT?: string;
  };
}

export interface RunOptions {
  prefer?: 'ios' | 'android';
  device?: string;
  scheme?: string;
  configuration?: string;
  variant?: string;
}
