import { execSync, spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DeviceInfo, DeviceConfig } from "./types";
import { Logger } from "./logger";

export class AppRunner {
  private config: DeviceConfig;
  private isExpo: boolean;
  private projectType: "expo" | "expo-bare" | "react-native-cli";

  constructor(config: DeviceConfig) {
    this.config = config;
    this.projectType = this.detectProjectType();
    this.isExpo =
      this.projectType === "expo" || this.projectType === "expo-bare";
  }

  /**
   * Detect project type: Expo (managed), Expo (bare), or React Native CLI
   */
  private detectProjectType(): "expo" | "expo-bare" | "react-native-cli" {
    try {
      // 1. Forced by environment variable
      const forced = process.env["FORCE_PROJECT_TYPE"];
      if (
        forced === "expo" ||
        forced === "expo-bare" ||
        forced === "react-native-cli"
      ) {
        Logger.info(
          `Project type forced to ${forced} via environment variable`
        );
        return forced;
      }

      // 2. package.json check
      const packageJsonPath = join(process.cwd(), "package.json");
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          const hasExpo = !!dependencies.expo;
          const hasRN = !!dependencies["react-native"];
          const hasIos = existsSync(join(process.cwd(), "ios"));
          const hasAndroid = existsSync(join(process.cwd(), "android"));

          // Expo bare workflow: expo dependency + native ios/android folders
          if (hasExpo && (hasIos || hasAndroid)) {
            Logger.info("Detected as Expo Bare Workflow project");
            return "expo-bare";
          }

          if (hasExpo) {
            Logger.info("Detected as Expo Managed Workflow project");
            return "expo";
          }

          if (hasRN) {
            Logger.info(
              "Detected as React Native CLI project (from package.json)"
            );
            return "react-native-cli";
          }
        } catch {
          Logger.warning("Failed to parse package.json");
        }
      }

      // 3. app.json check
      const appJsonPath = join(process.cwd(), "app.json");
      if (existsSync(appJsonPath)) {
        try {
          const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
          if (appJson.expo) {
            Logger.info(
              "Detected as Expo Managed Workflow project (from app.json)"
            );
            return "expo";
          } else {
            Logger.info(
              "Detected as React Native CLI project (from app.json structure)"
            );
            return "react-native-cli";
          }
        } catch {
          Logger.warning("Failed to parse app.json");
        }
      }

      // 4. Folder structure check
      const iosDir = join(process.cwd(), "ios");
      const androidDir = join(process.cwd(), "android");
      if (existsSync(iosDir) || existsSync(androidDir)) {
        Logger.info(
          "Detected as React Native CLI project (from ios/android folders)"
        );
        return "react-native-cli";
      }

      // 5. Default fallback
      Logger.warning(
        "Could not determine project type. Defaulting to React Native CLI"
      );
      return "react-native-cli";
    } catch (error) {
      Logger.warning(
        "Error detecting project type, defaulting to React Native CLI"
      );
      return "react-native-cli";
    }
  }

  runIosOnDevice(device: DeviceInfo): void {
    if (!device.udid) {
      throw new Error("iOS device UDID is required");
    }

    Logger.separator();
    Logger.success("iOS device found! Preparing to run...");
    Logger.device(`Device UDID: ${device.udid}`);
    Logger.device(`Scheme: ${this.config.iosScheme || "Default"}`);
    Logger.device(`Configuration: Debug`);

    if (!this.hasCommand("npx")) {
      Logger.error("npx is required");
      process.exit(10);
    }

    let args: string[];

    if (this.isExpo) {
      // Managed workflow uses expo run
      Logger.step("Running with Expo (managed) on iOS device...");
      args = ["expo", "run:ios", "--device", device.udid, "--no-bundler"];
      args.push("--configuration", "Debug");
    } else {
      // React Native CLI or Expo bare workflow uses react-native run
      Logger.step(
        "Running with React Native CLI / Expo Bare Workflow on iOS device..."
      );
      args = ["react-native", "run-ios", "--udid", device.udid];
    }

    // Add scheme if provided
    if (this.config.iosScheme) args.push("--scheme", this.config.iosScheme);

    this.executeCommand("npx", args);
  }

  runAndroidOnDevice(device: DeviceInfo): void {
    if (!device.serial) {
      throw new Error("Android device Serial is required");
    }

    Logger.separator();
    Logger.success("Android device found! Preparing to run...");
    Logger.device(`Device Serial: ${device.serial}`);
    Logger.device(`Using variant: debug`);

    if (!this.hasCommand("npx")) {
      Logger.error("npx is required");
      process.exit(11);
    }

    let args: string[];

    if (this.isExpo) {
      // Managed workflow uses expo run
      Logger.step("Running with Expo (managed) on Android device...");
      args = ["expo", "run:android", "--device", device.serial, "--no-bundler"];
    } else {
      // React Native CLI or Expo bare workflow uses react-native run
      Logger.step(
        "Running with React Native CLI / Expo Bare Workflow on Android device..."
      );
      args = ["react-native", "run-android", "--deviceId", device.serial];
    }

    args.push("--mode=debug");

    this.executeCommand("npx", args);
  }

  private executeCommand(command: string, args: string[]): void {
    try {
      Logger.info(`Executing: ${command} ${args.join(" ")}`);

      const child = spawn(command, args, {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      child.on("close", (code) => {
        if (code !== 0) {
          Logger.error(`Command execution failed (exit code: ${code})`);

          if (code === 65) {
            Logger.info(
              "Hint: This could be an Xcode build error. Check the logs above."
            );
          } else if (code === 1) {
            Logger.info("Hint: If using Expo, try running 'npx expo install'.");
          }

          if (args[0] === "expo" && args[1]?.startsWith("run:")) {
            Logger.warning(
              "Expo run command failed. Attempting fallback method..."
            );
            this.tryFallbackCommand(args);
          } else {
            process.exit(code || 1);
          }
        }
      });

      child.on("error", (error) => {
        Logger.error(`Command execution error: ${error.message}`);
        if (error.message.includes("ENOENT")) {
          Logger.info(
            "Hint: The command could not be found. Make sure it's installed."
          );
          if (args[0] === "expo") {
            Logger.info("Try installing Expo CLI: npm install -g expo-cli");
          } else if (args[0] === "react-native") {
            Logger.info(
              "Try installing React Native CLI: npm install -g @react-native-community/cli"
            );
          }
        }
        process.exit(1);
      });
    } catch (error) {
      Logger.error(`Command execution failed: ${error}`);
      if (args[0] === "expo") {
        Logger.warning("Expo command failed. Attempting fallback method...");
        this.tryFallbackCommand(args);
      } else {
        process.exit(1);
      }
    }
  }

  private tryFallbackCommand(originalArgs: string[]): void {
    try {
      const platform = originalArgs[1]?.includes("ios") ? "ios" : "android";
      const deviceFlag = platform === "ios" ? "--udid" : "--deviceId";
      const deviceId = originalArgs[3];

      if (!deviceId) {
        Logger.error("Device ID not found in original command");
        process.exit(1);
        return;
      }

      Logger.step(`Trying fallback with React Native CLI for ${platform}...`);
      const fallbackArgs: string[] = [
        "react-native",
        `run-${platform}`,
        deviceFlag,
        deviceId,
      ];

      if (platform === "ios") {
        if (this.config.iosScheme)
          fallbackArgs.push("--scheme", this.config.iosScheme);

        fallbackArgs.push("--configuration", "Debug");
      }

      if (platform === "android") {
        fallbackArgs.push("--mode=debug");
      }

      const child = spawn("npx", fallbackArgs, {
        stdio: "inherit",
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      child.on("close", (code: number | null) => {
        if (code !== 0) {
          Logger.error(
            `Fallback command execution failed (exit code: ${code})`
          );
          process.exit(code || 1);
        }
      });

      child.on("error", (error: Error) => {
        Logger.error(`Fallback command execution error: ${error.message}`);
        process.exit(1);
      });
    } catch (error) {
      Logger.error(`Fallback command execution failed: ${error}`);
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
