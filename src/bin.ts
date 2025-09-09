#!/usr/bin/env node

import { ExpoDeviceRunner } from './index';
import { Command } from 'commander';
import packageJson from '../package.json';

try {
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
} catch (error) {
  console.error('Error:', (error as Error).message);
  process.exit(1);
}
