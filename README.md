# React Native Device Runner

Automatically detects connected physical devices and runs your React Native or Expo app with a single command. Works seamlessly with both Expo and React Native CLI projects.

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
- For Expo projects: Expo SDK installed
- For React Native CLI projects: React Native CLI installed
- `jq` (optional, for advanced JSON parsing)

## 🚀 Installation & Usage

### Method 1: Run directly with npx (Recommended)

```bash
# Auto-detect (iOS preferred)
npx react-native-device-runner

# Prefer Android
npx react-native-device-runner --prefer android

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

> **Note:** The tool automatically uses `Debug` for iOS configuration and `debug` for Android variant - these values are hardcoded and don't need to be configured.

### 1. `app.json` extra section (Expo projects)

```json
{
  "expo": {
    "extra": {
      "IOS_SCHEME": "myapp",
      "IOS_BUNDLE_ID": "com.mycompany.myapp",
      "AOS_APP_ID": "com.mycompany.myapp"
    }
  }
}
```

### 2. `.env` file

```bash
IOS_SCHEME=myapp
IOS_BUNDLE_ID=com.mycompany.myapp
AOS_APP_ID=com.mycompany.myapp
```

### 3. Environment variables

```bash
export IOS_SCHEME="myapp"
export IOS_BUNDLE_ID="com.mycompany.myapp"
npx react-native-device-runner
```

### 4. Force project type

If automatic detection fails or you need to override:

```bash
# Force Expo mode
export FORCE_PROJECT_TYPE="expo"
npx react-native-device-runner

# Force React Native CLI mode
export FORCE_PROJECT_TYPE="react-native-cli"
npx react-native-device-runner
```

## 🎯 Example Usage

````bash
$ npx react-native-device-runner

┌─────────────────────────────────────────────────────────────────────────────┐
│                🚀 React Native Device Runner                          │
│              Auto Device Detection & Runner Script                         │
└─────────────────────────────────────────────────────────────────────────────┘

## 📝 Configuration Variables

| Variable            | Description             | Default      | Example                 |
| ------------------- | ----------------------- | ------------ | ----------------------- |
| `IOS_SCHEME`        | iOS build scheme        | -            | `myapp`                 |
| `IOS_BUNDLE_ID`     | iOS bundle ID           | -            | `com.mycompany.myapp`   |
| `IOS_WORKSPACE`     | iOS workspace path      | -            | `ios/MyApp.xcworkspace` |
| `IOS_DERIVED_DATA`  | iOS build data path     | `.build/ios` | `.build/ios`            |
| `AOS_APP_ID`        | Android app ID          | -            | `com.mycompany.myapp`   |
| `AOS_MODULE`        | Android module name     | `app`        | `app`                   |

> **Note:** The tool automatically uses `Debug` for iOS configuration and `debug` for Android variant. These values are hardcoded and don't need to be configured.

## Project Type Detection

React Native Device Runner automatically detects whether your project is using Expo or React Native CLI based on several factors:

1. **Package Dependencies**: Checks if `expo` is listed in your package.json dependencies
2. **Configuration Files**: Looks for Expo-specific files like app.json with an expo section
3. **Directory Structure**: Checks for the presence of ios/ and android/ folders
4. **Command Availability**: Verifies that the necessary CLI tools are installed

The tool will optimize the build and run commands based on the detected project type. If automatic detection fails, it defaults to React Native CLI mode.

## 🚫 Troubleshooting

### Metro/Expo compatibility errors

If you encounter errors related to Metro bundler or Expo CLI internals like:

- `Package subpath './src/lib/TerminalReporter' is not defined by 'exports'`
- `Cannot find module 'metro/src/lib/TerminalReporter'`

Try one of these solutions:

1. Force React Native CLI mode:

```bash
export FORCE_PROJECT_TYPE="react-native-cli"
npx react-native-device-runner
````

2. Run with the `--no-bundler` option (for Expo projects):

```bash
npx expo run:ios --device YOUR_DEVICE_ID --no-bundler
npx expo run:android --device YOUR_DEVICE_ID --no-bundler
```

3. Update your Metro and Expo dependencies to compatible versions:

```bash
npx expo install metro metro-resolver
```

> **Note:** The tool automatically uses `Debug` build configuration for iOS and `debug` variant for Android - you don't need to specify these values.

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
