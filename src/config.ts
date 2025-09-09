import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { DeviceConfig, ExpoConfig } from "./types";
import { Logger } from "./logger";

export class ConfigLoader {
  private config: DeviceConfig = {};
  private isExpo: boolean = false;

  constructor() {
    this.loadFromEnv();
    this.detectProjectType();
    this.loadFromProjectConfig();
    this.setDefaults();
  }

  private detectProjectType(): void {
    try {
      // Check if package.json exists and has dependencies
      const packageJsonPath = join(process.cwd(), "package.json");
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          // First check if expo is installed
          if (dependencies.expo) {
            try {
              // Verify the expo command works without requiring metro internals
              execSync("npx expo --help", { stdio: "ignore" });
              this.isExpo = true;
              Logger.info("Detected as an Expo project");
              return;
            } catch (error) {
              Logger.warning("Expo package found but expo CLI is not working");
            }
          }
        } catch (error) {
          Logger.warning("Failed to parse package.json");
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
            const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
            if (appJson.expo) {
              this.isExpo = true;
              Logger.info("Detected as an Expo project from app.json");
              return;
            }
          } catch (error) {
            // Failed to parse app.json, continue checking
          }
        }

        // If we can't determine from app.json, try running expo command
        try {
          execSync("npx expo --help", { stdio: "ignore" });
          this.isExpo = true;
          Logger.info("Detected as an Expo project");
          return;
        } catch (error) {
          Logger.warning("Expo config files found but expo CLI is not working");
        }
      }

      // Check for React Native CLI project
      const iosDir = join(process.cwd(), "ios");
      const androidDir = join(process.cwd(), "android");

      if (existsSync(iosDir) || existsSync(androidDir)) {
        this.isExpo = false;
        Logger.info("Detected as a React Native CLI project");
        return;
      }

      this.isExpo = false;
      Logger.warning(
        "Could not determine project type with certainty, defaulting to React Native CLI"
      );
    } catch (error) {
      this.isExpo = false;
      Logger.warning(
        "Error detecting project type, defaulting to React Native CLI"
      );
    }
  }

  private loadFromEnv(): void {
    Logger.step("Initializing environment variables...");

    // Load .env file
    const envPath = join(process.cwd(), ".env");
    if (existsSync(envPath)) {
      Logger.step("Loading .env file...");
      const envContent = readFileSync(envPath, "utf8");
      const envVars = this.parseEnvFile(envContent);

      Object.entries(envVars).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      Logger.success(".env file loaded successfully");
    }

    // Load settings from environment variables
    this.config = {
      iosScheme: process.env["IOS_SCHEME"],
      iosConfiguration: process.env["IOS_CONFIGURATION"],
      iosWorkspace: process.env["IOS_WORKSPACE"],
      iosDerivedData: process.env["IOS_DERIVED_DATA"],
      iosBundleId: process.env["IOS_BUNDLE_ID"],
      androidAppId: process.env["AOS_APP_ID"],
      androidModule: process.env["AOS_MODULE"],
      androidVariant: process.env["AOS_VARIANT"],
    };

    Logger.success("Environment variables initialized");
  }

  private parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          envVars[key] = value;
        }
      }
    }

    return envVars;
  }

  private loadFromProjectConfig(): void {
    if (this.isExpo) {
      this.loadFromExpoConfig();
    } else {
      this.loadFromReactNativeConfig();
    }
  }

  private loadFromExpoConfig(): void {
    Logger.step("Reading Expo configuration...");

    try {
      // First try to read from app.json directly
      const appJsonPath = join(process.cwd(), "app.json");
      if (existsSync(appJsonPath)) {
        try {
          const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
          if (appJson.expo) {
            this.processExpoConfig(appJson.expo);
            Logger.success("Expo configuration loaded from app.json");
            return;
          }
        } catch (error) {
          Logger.warning("Failed to parse app.json, trying alternative method");
        }
      }

      // If app.json approach failed, try using expo config command
      try {
        // Execute npx expo config --json with a timeout to prevent hanging
        const configOutput = execSync("npx expo config --json", {
          encoding: "utf8",
          cwd: process.cwd(),
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 10000, // 10 second timeout
        });

        const expoConfig: ExpoConfig = JSON.parse(configOutput);
        this.processExpoConfig(expoConfig);
        Logger.success("Expo configuration loaded successfully");
      } catch (error) {
        // If expo config command fails, try reading package.json as fallback
        Logger.warning(
          "Failed to run expo config command, trying package.json"
        );
        this.tryLoadFromPackageJson();
      }
    } catch (error) {
      Logger.warning(
        "Failed to load Expo configuration. Using default values."
      );
      this.tryLoadFromPackageJson();
    }
  }

  private processExpoConfig(expoConfig: any): void {
    // Load settings from extra field
    if (expoConfig.extra) {
      this.config.iosScheme =
        this.config.iosScheme || expoConfig.extra["IOS_SCHEME"];
      this.config.iosConfiguration =
        this.config.iosConfiguration || expoConfig.extra["IOS_CONFIGURATION"];
      this.config.iosWorkspace =
        this.config.iosWorkspace || expoConfig.extra["IOS_WORKSPACE"];
      this.config.iosDerivedData =
        this.config.iosDerivedData || expoConfig.extra["IOS_DERIVED_DATA"];
      this.config.androidAppId =
        this.config.androidAppId || expoConfig.extra["AOS_APP_ID"];
      this.config.androidModule =
        this.config.androidModule || expoConfig.extra["AOS_MODULE"];
      this.config.androidVariant =
        this.config.androidVariant || expoConfig.extra["AOS_VARIANT"];
    }

    // Load settings from default fields
    if (expoConfig.ios?.bundleIdentifier) {
      this.config.iosBundleId =
        this.config.iosBundleId || expoConfig.ios.bundleIdentifier;
    }

    if (expoConfig.android?.package && !this.config.androidAppId) {
      this.config.androidAppId = expoConfig.android.package;
    }
  }

  private tryLoadFromPackageJson(): void {
    try {
      const packageJsonPath = join(process.cwd(), "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

        if (packageJson.name && !this.config.iosScheme) {
          this.config.iosScheme = packageJson.name;
        }

        Logger.success("Configuration loaded from package.json");
      }
    } catch (error) {
      Logger.warning("Failed to load configuration from package.json");
    }
  }

  private loadFromReactNativeConfig(): void {
    Logger.step("Reading React Native configuration...");

    try {
      // Try to read app name from package.json
      const packageJsonPath = join(process.cwd(), "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

        // For React Native CLI projects, we would need to parse app IDs from
        // ios/Info.plist, android/app/build.gradle, etc., but this is complex
        // so we rely on environment variables or user input.
        if (packageJson.name && !this.config.iosScheme) {
          this.config.iosScheme = packageJson.name;
        }
      }

      Logger.success("React Native configuration loaded successfully");
    } catch (error) {
      Logger.warning(
        "Failed to load React Native configuration. Using default values."
      );
    }
  }

  private setDefaults(): void {
    this.config = {
      iosScheme: this.config.iosScheme || "",
      iosConfiguration: this.config.iosConfiguration || "Debug",
      iosWorkspace: this.config.iosWorkspace || "",
      iosDerivedData: this.config.iosDerivedData || ".build/ios",
      iosBundleId: this.config.iosBundleId || "",
      androidAppId: this.config.androidAppId || "",
      androidModule: this.config.androidModule || "app",
      androidVariant: this.config.androidVariant || "debug",
    };
  }

  getConfig(): DeviceConfig {
    return { ...this.config };
  }

  isExpoProject(): boolean {
    return this.isExpo;
  }
}
