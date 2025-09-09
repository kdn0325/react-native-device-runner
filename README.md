# React Native Device Runner

Automatically detects connected physical devices and runs your React Native or Expo app with a single command.

## 📋 Requirements

### iOS

- Xcode 15+ (recommended)
- Connected iOS device (Developer Mode enabled)
- Device trusted in Xcode

### Android

- Android SDK installed
- `adb` command available
- USB debugging enabled on device

### Common

- Node.js & npm or pnpm
- Expo CLI (`npx expo`) for Expo projects
- `jq` (optional, for advanced JSON parsing)

## 🚀 Installation & Usage

### Method 1: Run directly with npx (Recommended)

```bash
# Auto-detect (iOS preferred)
npx react-native-device-runner

# Prefer Android
tnpx react-native-device-runner --prefer android

# Prefer iOS
npx react-native-device-runner --prefer ios

# Help
npx react-native-device-runner --help

# Version
npx react-native-device-runner --version
```

### Method 2: Global Install

```bash
npm install -g react-native-device-runner

# Usage after install
rn-device
# or
rndr
# or
react-native-device-runner
```

## ⚙️ Configuration

You can configure build options using one of the following methods:

### 1. `app.json` extra section (Expo projects)

```json
{
  "expo": {
    "extra": {
      "IOS_SCHEME": "myapp",
      "IOS_CONFIGURATION": "Debug",
      "IOS_BUNDLE_ID": "com.mycompany.myapp",
      "AOS_APP_ID": "com.mycompany.myapp",
      "AOS_VARIANT": "debug"
    }
  }
}
```

### 2. `.env` file

```bash
IOS_SCHEME=myapp
IOS_CONFIGURATION=Debug
IOS_BUNDLE_ID=com.mycompany.myapp
AOS_APP_ID=com.mycompany.myapp
AOS_VARIANT=debug
```

### 3. Environment variables

```bash
export IOS_SCHEME="myapp"
export IOS_BUNDLE_ID="com.mycompany.myapp"
npx react-native-device-runner
```

## 🎯 Example Usage

```bash
$ npx react-native-device-runner

┌─────────────────────────────────────────────────────────────────────────────┐
│                React Native Device Runner                             │
│              Auto Device Detection & Runner Script                         │
└─────────────────────────────────────────────────────────────────────────────┘

📋 Initializing environment variables...
✅ Environment variables initialized
📋 Reading Expo/React Native configuration...
✅ Configuration loaded successfully
──────────────────────────────────────────────────────────────────────────────
📋 Searching for connected devices...
✅ iOS device found: a64e6f3a22df699e4df42ec9aa462eeeae7c8be4
ℹ️ No Android device detected
──────────────────────────────────────────────────────────────────────────────
✅ iOS device found! Preparing to run...
📱 Device UDID: a64e6f3a22df699e4df42ec9aa462eeeae7c8be4
📱 Scheme: myapp
📱 Configuration: Debug
📋 Running expo run:ios...
```

## 📝 Configuration Variables

| Variable            | Description             | Default      | Example                 |
| ------------------- | ----------------------- | ------------ | ----------------------- |
| `IOS_SCHEME`        | iOS build scheme        | -            | `myapp`                 |
| `IOS_CONFIGURATION` | iOS build configuration | `Debug`      | `Release`               |
| `IOS_BUNDLE_ID`     | iOS bundle ID           | -            | `com.mycompany.myapp`   |
| `IOS_WORKSPACE`     | iOS workspace path      | -            | `ios/MyApp.xcworkspace` |
| `IOS_DERIVED_DATA`  | iOS build data path     | `.build/ios` | `.build/ios`            |
| `AOS_APP_ID`        | Android app ID          | -            | `com.mycompany.myapp`   |
| `AOS_MODULE`        | Android module name     | `app`        | `app`                   |
| `AOS_VARIANT`       | Android build variant   | `debug`      | `release`               |

## 🛠 Troubleshooting

### iOS device not detected

- Check device trust settings in Xcode
- Make sure the device is trusted
- Check device status in Xcode > Window > Devices and Simulators

### Android device not detected

- Make sure USB debugging is enabled
- Check device connection with `adb devices`
- Try a different USB cable or port

### Expo/React Native config not loading

- Test with `npx expo config --json` (for Expo)
- Make sure your config files are valid JSON
- Install `jq` if needed: `brew install jq` (macOS) or `apt install jq` (Ubuntu)

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)

---
