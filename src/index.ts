import { Command } from 'commander';
import { ConfigLoader } from './config';
import { DeviceDetector } from './device-detector';
import { ExpoRunner } from './runner';
import { Logger } from './logger';
import { RunOptions } from './types';
import packageJson from '../package.json';

class ExpoDeviceRunner {
  private configLoader: ConfigLoader;
  private deviceDetector: typeof DeviceDetector;
  private runner: ExpoRunner;

  constructor() {
    this.configLoader = new ConfigLoader();
    this.deviceDetector = DeviceDetector;
    this.runner = new ExpoRunner(this.configLoader.getConfig());
  }

  async run(options: RunOptions = {}): Promise<void> {
    Logger.header();

    const devices = this.deviceDetector.findDevices();
    const { ios, android } = devices;

    // 두 기기 모두 연결된 경우
    if (ios && android) {
      if (options.prefer === 'android') {
        Logger.info('두 기기 모두 연결됨. Android 우선 실행합니다.');
        this.runner.runAndroidOnDevice(android);
      } else {
        Logger.info('두 기기 모두 연결됨. iOS 우선 실행합니다.');
        this.runner.runIosOnDevice(ios);
      }
      return;
    }

    // 단일 기기 연결
    if (ios) {
      this.runner.runIosOnDevice(ios);
      return;
    }

    if (android) {
      this.runner.runAndroidOnDevice(android);
      return;
    }

    // 기기 없음
    Logger.error('연결된 물리 기기가 없습니다.');
    Logger.info('iOS: Xcode에서 기기 신뢰 설정을 확인하세요');
    Logger.info('Android: USB 디버깅이 활성화되어 있는지 확인하세요');
    process.exit(2);
  }
}

// CLI 인터페이스
function createCLI(): void {
  const program = new Command();

  program
    .name('expo-device-runner')
    .description('🚀 자동 기기 감지 & React Native/Expo 앱 실행 스크립트')
    .version(packageJson.version);

  program
    .option('--prefer <platform>', '우선 실행할 플랫폼 (ios | android)', 'ios')
    .action(async (options) => {
      const runner = new ExpoDeviceRunner();
      await runner.run({
        prefer: options.prefer as 'ios' | 'android'
      });
    });

  program.parse();
}

// 모듈로 사용할 때
export { ExpoDeviceRunner, ConfigLoader, DeviceDetector, ExpoRunner, Logger };
export * from './types';

// CLI로 실행될 때
if (require.main === module) {
  createCLI();
}
