# �� React Native Device Runner

자동으로 연결된 물리 기기를 감지하고 Expo 앱을 실행하는 스마트 스크립트입니다.

## 📋 요구사항

### iOS
- Xcode 15+ (권장)
- 연결된 iOS 기기 (Developer Mode 활성화)
- 기기 신뢰 설정 완료

### Android
- Android SDK 설치
- `adb` 명령어 사용 가능
- USB 디버깅 활성화된 기기

### 공통
- Node.js & npm/pnpm
- Expo CLI (`npx expo` 사용 가능)
- `jq` (JSON 파싱용, 선택사항)

## �� 설치 및 사용

### 1. 스크립트 다운로드
```bash
# 프로젝트 루트에 스크립트 복사
cp find-run-device.sh ./script/
chmod +x ./script/find-run-device.sh
```

### 2. package.json에 스크립트 추가
```json
{
  "scripts": {
    "device": "./script/find-run-device.sh",
    "device:android": "./script/find-run-device.sh --prefer android",
    "device:ios": "./script/find-run-device.sh --prefer ios"
  }
}
```

### 3. 실행
```bash
# 자동 감지 (iOS 우선)
pnpm device

# Android 우선 실행
pnpm device:android

# iOS 우선 실행
pnpm device:ios
```

## ⚙️ 설정 방법

### 방법 1: app.json의 extra 섹션 (권장)
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

### 방법 2: .env 파일
```bash
# .env 파일 생성
IOS_SCHEME=myapp
IOS_CONFIGURATION=Debug
IOS_BUNDLE_ID=com.mycompany.myapp
AOS_APP_ID=com.mycompany.myapp
AOS_VARIANT=debug
```

### 방법 3: 환경변수 직접 설정
```bash
export IOS_SCHEME="myapp"
export IOS_BUNDLE_ID="com.mycompany.myapp"
./script/find-run-device.sh
```

## 🎯 사용 예시

### 기본 사용
```bash
$ pnpm device

┌─────────────────────────────────────────────────────────────────────────────┐
│                    �� Expo Device Runner v2.0                              │
│              자동 기기 감지 & 실행 스크립트                                 │
└─────────────────────────────────────────────────────────────────────────────┘

�� 환경변수 초기화 중...
✅ 초기화 완료
�� Expo 설정 읽기 중 (JSON 모드)...
✅ Expo 설정 로드 완료
──────────────────────────────────────────────────────────────────────────────
📋 연결된 기기 탐색 중...
✅ iOS 기기 발견: a64e6f3a22df699e4df42ec9aa462eeeae7c8be4
ℹ️ Android 기기 없음
──────────────────────────────────────────────────────────────────────────────
──────────────────────────────────────────────────────────────────────────────
✅ iOS 기기 발견! 실행 준비 중...
📱 기기 UDID: a64e6f3a22df699e4df42ec9aa462eeeae7c8be4
📱 Scheme: myapp
📱 Configuration: Debug
📋 expo run:ios 실행 중...
```

### 두 기기 모두 연결된 경우
```bash
$ pnpm device:android

✅ iOS 기기 발견: a64e6f3a22df699e4df42ec9aa462eeeae7c8be4
✅ Android 기기 발견: emulator-5554
──────────────────────────────────────────────────────────────────────────────
ℹ️ 두 기기 모두 연결됨. Android 우선 실행합니다.
```

## �� 고급 사용법

### 커스텀 스크립트 실행
```bash
# 직접 실행
./script/find-run-device.sh

# Android 우선
./script/find-run-device.sh --prefer android

# iOS 우선
./script/find-run-device.sh --prefer ios
```

### 환경변수 오버라이드
```bash
# 특정 설정으로 일회성 실행
IOS_SCHEME="production" IOS_CONFIGURATION="Release" ./script/find-run-device.sh
```

## �� 문제 해결

### iOS 기기가 감지되지 않는 경우
1. Xcode에서 기기 신뢰 설정 확인
2. 기기에서 "이 컴퓨터를 신뢰하시겠습니까?" 선택
3. Xcode > Window > Devices and Simulators에서 기기 상태 확인

### Android 기기가 감지되지 않는 경우
1. USB 디버깅 활성화 확인
2. `adb devices` 명령어로 기기 연결 상태 확인
3. USB 케이블 교체 또는 다른 USB 포트 사용

### Expo 설정을 읽을 수 없는 경우
1. `npx expo config --json` 명령어 테스트
2. `jq` 설치: `brew install jq` (macOS) 또는 `apt install jq` (Ubuntu)
3. app.json 파일이 올바른 JSON 형식인지 확인

## 📝 설정 변수 목록

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `IOS_SCHEME` | iOS 빌드 스킴 | - | `myapp` |
| `IOS_CONFIGURATION` | iOS 빌드 설정 | `Debug` | `Release` |
| `IOS_BUNDLE_ID` | iOS 번들 ID | - | `com.mycompany.myapp` |
| `IOS_WORKSPACE` | iOS 워크스페이스 경로 | - | `ios/MyApp.xcworkspace` |
| `IOS_DERIVED_DATA` | iOS 빌드 데이터 경로 | `.build/ios` | `.build/ios` |
| `AOS_APP_ID` | Android 앱 ID | - | `com.mycompany.myapp` |
| `AOS_MODULE` | Android 모듈명 | `app` | `app` |
| `AOS_VARIANT` | Android 빌드 변형 | `debug` | `release` |


## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Expo](https://expo.dev/) - 훌륭한 React Native 개발 플랫폼
- [React Native](https://reactnative.dev/) - 크로스 플랫폼 모바일 개발 프레임워크

---

**Made with ❤️ for the React Native community**
