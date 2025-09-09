import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DeviceConfig, ExpoConfig } from './types';
import { Logger } from './logger';

export class ConfigLoader {
  private config: DeviceConfig = {};

  constructor() {
    this.loadFromEnv();
    this.loadFromExpoConfig();
    this.setDefaults();
  }

  private loadFromEnv(): void {
    Logger.step('환경변수 초기화 중...');
    
    // .env 파일 로드
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      Logger.step('.env 파일 로드 중...');
      const envContent = readFileSync(envPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);
      
      Object.entries(envVars).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      Logger.success('.env 파일 로드 완료');
    }

    // 환경변수에서 설정 로드
    this.config = {
      iosScheme: process.env['IOS_SCHEME'],
      iosConfiguration: process.env['IOS_CONFIGURATION'],
      iosWorkspace: process.env['IOS_WORKSPACE'],
      iosDerivedData: process.env['IOS_DERIVED_DATA'],
      iosBundleId: process.env['IOS_BUNDLE_ID'],
      androidAppId: process.env['AOS_APP_ID'],
      androidModule: process.env['AOS_MODULE'],
      androidVariant: process.env['AOS_VARIANT'],
    };

    Logger.success('초기화 완료');
  }

  private parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          envVars[key] = value;
        }
      }
    }
    
    return envVars;
  }

  private loadFromExpoConfig(): void {
    Logger.step('Expo 설정 읽기 중...');
    
    try {
      // npx expo config --json 실행
      const configOutput = execSync('npx expo config --json', { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const expoConfig: ExpoConfig = JSON.parse(configOutput);
      
      // extra 필드에서 설정 로드
      if (expoConfig.extra) {
        this.config.iosScheme = this.config.iosScheme || expoConfig.extra['IOS_SCHEME'];
        this.config.iosConfiguration = this.config.iosConfiguration || expoConfig.extra['IOS_CONFIGURATION'];
        this.config.iosWorkspace = this.config.iosWorkspace || expoConfig.extra['IOS_WORKSPACE'];
        this.config.iosDerivedData = this.config.iosDerivedData || expoConfig.extra['IOS_DERIVED_DATA'];
        this.config.androidAppId = this.config.androidAppId || expoConfig.extra['AOS_APP_ID'];
        this.config.androidModule = this.config.androidModule || expoConfig.extra['AOS_MODULE'];
        this.config.androidVariant = this.config.androidVariant || expoConfig.extra['AOS_VARIANT'];
      }
      
      // 기본 필드에서 설정 로드
      if (expoConfig.ios?.bundleIdentifier) {
        this.config.iosBundleId = this.config.iosBundleId || expoConfig.ios.bundleIdentifier;
      }
      
      if (expoConfig.android?.package && !this.config.androidAppId) {
        this.config.androidAppId = expoConfig.android.package;
      }
      
      Logger.success('Expo 설정 로드 완료');
    } catch (error) {
      Logger.warning('Expo 설정 로드 실패. 기본값을 사용합니다.');
    }
  }

  private setDefaults(): void {
    this.config = {
      iosScheme: this.config.iosScheme || '',
      iosConfiguration: this.config.iosConfiguration || 'Debug',
      iosWorkspace: this.config.iosWorkspace || '',
      iosDerivedData: this.config.iosDerivedData || '.build/ios',
      iosBundleId: this.config.iosBundleId || '',
      androidAppId: this.config.androidAppId || '',
      androidModule: this.config.androidModule || 'app',
      androidVariant: this.config.androidVariant || 'debug',
    };
  }

  getConfig(): DeviceConfig {
    return { ...this.config };
  }
}
