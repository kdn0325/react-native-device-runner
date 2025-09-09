import { execSync } from 'child_process';
import { DeviceInfo } from './types';
import { Logger } from './logger';

export class DeviceDetector {
  static findIosDevice(): DeviceInfo | null {
    try {
      // xcrun이 없으면 실패
      if (!this.hasCommand('xcrun')) {
        return null;
      }

      // Xcode 15+ devicectl 사용 (원본 bash 스크립트와 동일한 로직)
      if (this.hasCommand('jq')) {
        try {
          // devicectl --json 옵션 테스트 (원본과 동일)
          execSync('xcrun devicectl list devices --json >/dev/null 2>&1', { 
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          // devicectl JSON 출력 파싱
          const output = execSync('xcrun devicectl list devices --json', { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          const devices = JSON.parse(output);
          
          // 원본 bash 스크립트와 동일한 jq 필터링 로직
          // .result.devices[]? | select(.platform=="iOS" and .connectionState=="connected" and (.deviceType|test("physical"; "i"))) | .identifier
          const physicalDevice = devices.result?.devices?.find((device: any) => 
            device.platform === 'iOS' && 
            device.connectionState === 'connected' && 
            /physical/i.test(device.deviceType)
          );
          
          if (physicalDevice) {
            return {
              udid: physicalDevice.identifier,
              platform: 'ios' as const,
              name: physicalDevice.name
            };
          }
        } catch (error) {
          // devicectl 실패 시 fallback
        }
      }
      
      // Fallback: xctrace 사용 (원본과 동일)
      const output = execSync('xcrun xctrace list devices', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/\(([a-f0-9]{40})\)/);
        if (match) {
          const namePart = line.split('(')[0];
          return {
            udid: match[1],
            platform: 'ios' as const,
            name: namePart ? namePart.trim() : undefined
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  static findAndroidDevice(): DeviceInfo | null {
    try {
      // adb가 없으면 실패
      if (!this.hasCommand('adb')) {
        return null;
      }

      // ADB 서버 시작 (원본과 동일)
      execSync('adb start-server >/dev/null 2>&1', { 
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const output = execSync('adb devices -l', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // 원본 bash 스크립트와 동일한 awk 로직
      // awk 'NR>1 && $2=="device"{print $1}' | grep -v '^emulator-' | head -n1
      const lines = output.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2 && parts[1] === 'device' && parts[0] && !parts[0].startsWith('emulator-')) {
            return {
              serial: parts[0],
              platform: 'android' as const,
              name: line
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  static hasCommand(command: string): boolean {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  static findDevices(): { ios?: DeviceInfo; android?: DeviceInfo } {
    Logger.step('연결된 기기 탐색 중...');
    
    const iosDevice = this.findIosDevice();
    const androidDevice = this.findAndroidDevice();
    
    if (iosDevice) {
      Logger.success(`iOS 기기 발견: ${iosDevice.udid}`);
    } else {
      Logger.info('iOS 기기 없음');
    }
    
    if (androidDevice) {
      Logger.success(`Android 기기 발견: ${androidDevice.serial}`);
    } else {
      Logger.info('Android 기기 없음');
    }
    
    Logger.separator();
    
    return {
      ...(iosDevice && { ios: iosDevice }),
      ...(androidDevice && { android: androidDevice })
    };
  }
}
