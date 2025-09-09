import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { DeviceInfo, DeviceConfig } from "./types";
import { Logger } from "./logger";

export class AppRunner {
  private config: DeviceConfig;
  private isExpo: boolean;

  constructor(config: DeviceConfig) {
    this.config = config;
    this.isExpo = this.detectExpoProject();
  }

  /**
   * Detect if the project is an Expo project or a React Native CLI project
   */
  private detectExpoProject(): boolean {
    try {
      // Check if app.json or app.config.js file exists
      const appJsonPath = join(process.cwd(), "app.json");
      const appConfigPath = join(process.cwd(), "app.config.js");
      const appConfigTsPath = join(process.cwd(), "app.config.ts");

      if (
        existsSync(appJsonPath) ||
        existsSync(appConfigPath) ||
        existsSync(appConfigTsPath)
      ) {
        // If app.json file exists, check if expo command works
        try {
          execSync("npx expo --version", { stdio: "ignore" });
          Logger.info("Detected as an Expo project");
          return true;
        } catch (error) {
          Logger.warning("Expo config files found but expo CLI is not working");
          return false;
        }
      }

      Logger.info("Detected as a React Native CLI project");
      return false;
    } catch (error) {
      Logger.warning(
        "Error detecting project type, defaulting to React Native CLI"
      );
      return false;
    }
  }

  runIosOnDevice(device: DeviceInfo): void {
    if (!device.udid) {
      throw new Error("iOS device UDID is required");
    }

    Logger.separator();
    Logger.success("iOS device found! Preparing to run...");
    Logger.device(`Device UDID: ${device.udid}`);

    if (this.config.iosScheme) {
      Logger.device(`Scheme: ${this.config.iosScheme}`);
    }
    if (this.config.iosConfiguration) {
      Logger.device(`Configuration: ${this.config.iosConfiguration}`);
    }

    if (!this.hasCommand("npx")) {
      Logger.error("npx is required");
      process.exit(10);
    }

    let args: string[] = [];

    if (this.isExpo) {
      Logger.step("Running expo run:ios...");
      args = ["expo", "run:ios", "--device", device.udid];

      if (this.config.iosScheme) {
        args.push("--scheme", this.config.iosScheme);
      }
      if (this.config.iosConfiguration) {
        args.push("--configuration", this.config.iosConfiguration);
      }
    } else {
      Logger.step("Running react-native run-ios...");
      args = ["react-native", "run-ios", "--udid", device.udid];

      if (this.config.iosScheme) {
        args.push("--scheme", this.config.iosScheme);
      }
      if (this.config.iosConfiguration) {
        args.push("--configuration", this.config.iosConfiguration);
      }
    }

    this.executeCommand("npx", args);
  }

  runAndroidOnDevice(device: DeviceInfo): void {
    if (!device.serial) {
      throw new Error("Android device Serial is required");
    }

    Logger.separator();
    Logger.success("Android device found! Preparing to run...");
    Logger.device(`Device Serial: ${device.serial}`);

    if (this.config.androidVariant) {
      Logger.device(`Variant: ${this.config.androidVariant}`);
    }

    if (!this.hasCommand("npx")) {
      Logger.error("npx is required");
      process.exit(11);
    }

    let args: string[] = [];

    if (this.isExpo) {
      Logger.step("Running expo run:android...");
      args = ["expo", "run:android", "--device", device.serial];

      if (this.config.androidVariant) {
        args.push("--variant", this.config.androidVariant);
      }
    } else {
      Logger.step("Running react-native run-android...");
      args = ["react-native", "run-android", "--deviceId", device.serial];

      if (this.config.androidVariant) {
        args.push("--variant", this.config.androidVariant);
      }
    }

    this.executeCommand("npx", args);
  }

  private executeCommand(command: string, args: string[]): void {
    try {
      const child = spawn(command, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        if (code !== 0) {
          Logger.error(`Command execution failed (exit code: ${code})`);
          process.exit(code || 1);
        }
      });

      child.on("error", (error) => {
        Logger.error(`Command execution error: ${error.message}`);
        process.exit(1);
      });
    } catch (error) {
      Logger.error(`Command execution failed: ${error}`);
      process.exit(1);
    }
  }

  private hasCommand(command: string): boolean {
    try {
      execSync(`which ${command}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}
