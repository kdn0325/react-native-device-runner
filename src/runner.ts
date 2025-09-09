import { execSync, spawn } from 'child_process';
import { DeviceInfo, DeviceConfig } from './types';
import { Logger } from './logger';

export class ExpoRunner {
  private config: DeviceConfig;

  constructor(config: DeviceConfig) {
    this.config = config;
  }

  runIosOnDevice(device: DeviceInfo): void {
    if (!device.udid) {
      throw new Error('iOS 기기 UDID가 필요합니다');
    }

    Logger.separator();
    Logger.success('iOS 기기 발견! 실행 준비 중...');
    Logger.device(`기기 UDID: ${device.udid}`);
    
    if (this.config.iosScheme) {
      Logger.device(`Scheme: ${this.config.iosScheme}`);
    }
    if (this.config.iosConfiguration) {
      Logger.device(`Configuration: ${this.config.iosConfiguration}`);
    }

    if (!this.hasCommand('npx')) {
      Logger.error('npx가 필요합니다');
      process.exit(10);
    }

    Logger.step('expo run:ios 실행 중...');
    
    const args = ['expo', 'run:ios', '--device', device.udid];
    
    if (this.config.iosScheme) {
      args.push('--scheme', this.config.iosScheme);
    }
    if (this.config.iosConfiguration) {
      args.push('--configuration', this.config.iosConfiguration);
    }

    this.executeCommand('npx', args);
  }

  runAndroidOnDevice(device: DeviceInfo): void {
    if (!device.serial) {
      throw new Error('Android 기기 Serial이 필요합니다');
    }

    Logger.separator();
    Logger.success('Android 기기 발견! 실행 준비 중...');
    Logger.device(`기기 Serial: ${device.serial}`);
    
    if (this.config.androidVariant) {
      Logger.device(`Variant: ${this.config.androidVariant}`);
    }

    if (!this.hasCommand('npx')) {
      Logger.error('npx가 필요합니다');
      process.exit(11);
    }

    Logger.step('expo run:android 실행 중...');
    
    const args = ['expo', 'run:android', '--device', device.serial];
    
    if (this.config.androidVariant) {
      args.push('--variant', this.config.androidVariant);
    }

    this.executeCommand('npx', args);
  }

  private executeCommand(command: string, args: string[]): void {
    try {
      const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code !== 0) {
          Logger.error(`명령 실행 실패 (종료 코드: ${code})`);
          process.exit(code || 1);
        }
      });

      child.on('error', (error) => {
        Logger.error(`명령 실행 오류: ${error.message}`);
        process.exit(1);
      });
    } catch (error) {
      Logger.error(`명령 실행 실패: ${error}`);
      process.exit(1);
    }
  }

  private hasCommand(command: string): boolean {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}
