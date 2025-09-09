import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { DeviceInfo, DeviceConfig } from "./types";
import { Logger } from "./logger";

export class AppRunner {
  private config: DeviceConfig;
  private isExpo: boolean;
  private projectType: "expo" | "react-native-cli";

  constructor(config: DeviceConfig) {
    this.config = config;
    this.projectType = this.detectProjectType();
    this.isExpo = this.projectType === "expo";
  }

  /**
   * Detect if the project is an Expo project or a React Native CLI project
   */
  private detectProjectType(): "expo" | "react-native-cli" {
    try {
      // Check if package.json exists and has dependencies
      const packageJsonPath = join(process.cwd(), "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          execSync(`cat ${packageJsonPath}`, { encoding: "utf8" })
        );
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // First check if expo is installed
        if (dependencies.expo) {
          try {
            // Verify the expo command works without requiring metro internals
            execSync("npx expo --help", { stdio: "ignore" });
            Logger.info("Detected as an Expo project");
            return "expo";
          } catch (error) {
            Logger.warning("Expo package found but expo CLI is not working");
          }
        }
      }

      // Check if app.json or app.config.js file exists
      const appJsonPath = join(process.cwd(), "app.json");
      const appConfigPath = join(process.cwd(), "app.config.js");
      const appConfigTsPath = join(process.cwd(), "app.config.ts");

      if (
        existsSync(appJsonPath) ||
        existsSync(appConfigPath) ||
        existsSync(appConfigTsPath)
      ) {
        // Check if the app.json contains expo configuration
        if (existsSync(appJsonPath)) {
          try {
            const appJson = JSON.parse(
              execSync(`cat ${appJsonPath}`, { encoding: "utf8" })
            );
            if (appJson.expo) {
              Logger.info("Detected as an Expo project from app.json");
              return "expo";
            }
          } catch (error) {
            // Failed to parse app.json, continue checking
          }
        }

        // If we can't determine from app.json, try running expo command
        try {
          execSync("npx expo --help", { stdio: "ignore" });
          Logger.info("Detected as an Expo project");
          return "expo";
        } catch (error) {
          Logger.warning("Expo config files found but expo CLI is not working");
        }
      }

      // Check for React Native CLI project
      const iosDir = join(process.cwd(), "ios");
      const androidDir = join(process.cwd(), "android");

      if (existsSync(iosDir) || existsSync(androidDir)) {
        Logger.info("Detected as a React Native CLI project");
        return "react-native-cli";
      }

      Logger.warning(
        "Could not determine project type with certainty, defaulting to React Native CLI"
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
      Logger.step("Running with Expo on iOS device...");
      // Use the safe command approach that doesn't rely on Metro internals
      args = ["expo", "run:ios", "--device", device.udid, "--no-bundler"];

      if (this.config.iosScheme) {
        args.push("--scheme", this.config.iosScheme);
      }
      if (this.config.iosConfiguration) {
        args.push("--configuration", this.config.iosConfiguration);
      }
    } else {
      Logger.step("Running with React Native CLI on iOS device...");
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
      Logger.step("Running with Expo on Android device...");
      // Use the safe command approach that doesn't rely on Metro internals
      args = ["expo", "run:android", "--device", device.serial, "--no-bundler"];

      if (this.config.androidVariant) {
        args.push("--variant", this.config.androidVariant);
      }
    } else {
      Logger.step("Running with React Native CLI on Android device...");
      args = ["react-native", "run-android", "--deviceId", device.serial];

      if (this.config.androidVariant) {
        args.push("--variant", this.config.androidVariant);
      }
    }

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

      // Handle process lifecycle
      child.on("close", (code) => {
        if (code !== 0) {
          Logger.error(`Command execution failed (exit code: ${code})`);
          // Handle specific exit codes
          if (code === 65) {
            // Often seen with Xcode build errors
            Logger.info(
              "Hint: This could be an Xcode build error. Check the logs above."
            );
          } else if (code === 1) {
            // Generic error
            Logger.info(
              "Hint: If using Expo, try running 'npx expo install' to ensure dependencies are correctly installed."
            );
          }

          // Try alternative command if the primary one fails
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

        // Provide helpful suggestions based on the error
        if (error.message.includes("ENOENT")) {
          Logger.info(
            "Hint: The command could not be found. Make sure it's installed properly."
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

      // Try alternative approaches
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
      const deviceId = originalArgs[3]; // Get the device ID from the original command

      if (!deviceId) {
        Logger.error("Device ID not found in original command");
        process.exit(1);
        return;
      }

      // Use a more direct approach with react-native CLI
      Logger.step(`Trying fallback with React Native CLI for ${platform}...`);

      const fallbackArgs: string[] = [
        "react-native",
        `run-${platform}`,
        deviceFlag,
        deviceId,
      ];

      // Add any additional flags
      if (platform === "ios") {
        if (this.config.iosScheme) {
          fallbackArgs.push("--scheme", this.config.iosScheme);
        }
        if (this.config.iosConfiguration) {
          fallbackArgs.push("--configuration", this.config.iosConfiguration);
        }
      } else {
        if (this.config.androidVariant) {
          fallbackArgs.push("--variant", this.config.androidVariant);
        }
      }

      // Execute the fallback command
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
