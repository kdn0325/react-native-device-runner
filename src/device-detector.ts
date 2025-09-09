import { execSync } from "child_process";
import { DeviceInfo } from "./types";
import { Logger } from "./logger";

export class DeviceDetector {
  static findIosDevice(): DeviceInfo | null {
    try {
      // Fail if xcrun is not available
      if (!this.hasCommand("xcrun")) {
        return null;
      }

      // Use devicectl for Xcode 15+ (same logic as original bash script)
      if (this.hasCommand("jq")) {
        try {
          // Test devicectl --json option (same as original)
          execSync("xcrun devicectl list devices --json >/dev/null 2>&1", {
            stdio: ["pipe", "pipe", "pipe"],
          });

          // Parse devicectl JSON output
          const output = execSync("xcrun devicectl list devices --json", {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          });

          const devices = JSON.parse(output);

          // Same filtering logic as original bash script with jq
          // .result.devices[]? | select(.platform=="iOS" and .connectionState=="connected" and (.deviceType|test("physical"; "i"))) | .identifier
          const physicalDevice = devices.result?.devices?.find(
            (device: any) =>
              device.platform === "iOS" &&
              device.connectionState === "connected" &&
              /physical/i.test(device.deviceType)
          );

          if (physicalDevice) {
            return {
              udid: physicalDevice.identifier,
              platform: "ios" as const,
              name: physicalDevice.name,
            };
          }
        } catch (error) {
          // Fallback if devicectl fails
        }
      }

      // Fallback: use xctrace (same as original)
      const output = execSync("xcrun xctrace list devices", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      const lines = output.split("\n");
      for (const line of lines) {
        const match = line.match(/\(([a-f0-9]{40})\)/);
        if (match) {
          const namePart = line.split("(")[0];
          return {
            udid: match[1],
            platform: "ios" as const,
            name: namePart ? namePart.trim() : undefined,
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
      // Fail if adb is not available
      if (!this.hasCommand("adb")) {
        return null;
      }

      // Start ADB server (same as original)
      execSync("adb start-server >/dev/null 2>&1", {
        stdio: ["pipe", "pipe", "pipe"],
      });

      const output = execSync("adb devices -l", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Same logic as original bash script with awk
      // awk 'NR>1 && $2=="device"{print $1}' | grep -v '^emulator-' | head -n1
      const lines = output.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (
            parts.length >= 2 &&
            parts[1] === "device" &&
            parts[0] &&
            !parts[0].startsWith("emulator-")
          ) {
            return {
              serial: parts[0],
              platform: "android" as const,
              name: line,
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
      execSync(`which ${command}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  static findDevices(): { ios?: DeviceInfo; android?: DeviceInfo } {
    Logger.step("Searching for connected devices...");

    const iosDevice = this.findIosDevice();
    const androidDevice = this.findAndroidDevice();

    if (iosDevice) {
      Logger.success(`iOS device found: ${iosDevice.udid}`);
    } else {
      Logger.info("No iOS device detected");
    }

    if (androidDevice) {
      Logger.success(`Android device found: ${androidDevice.serial}`);
    } else {
      Logger.info("No Android device detected");
    }

    Logger.separator();

    return {
      ...(iosDevice && { ios: iosDevice }),
      ...(androidDevice && { android: androidDevice }),
    };
  }
}
