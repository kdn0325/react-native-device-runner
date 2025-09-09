import { Command } from "commander";
import { ConfigLoader } from "./config";
import { DeviceDetector } from "./device-detector";
import { AppRunner } from "./runner";
import { Logger } from "./logger";
import { RunOptions } from "./types";
import packageJson from "../package.json";

class DeviceRunner {
  private configLoader: ConfigLoader;
  private deviceDetector: typeof DeviceDetector;
  private runner: AppRunner;

  constructor() {
    this.configLoader = new ConfigLoader();
    this.deviceDetector = DeviceDetector;
    this.runner = new AppRunner(this.configLoader.getConfig());
  }

  async run(options: RunOptions = {}): Promise<void> {
    Logger.header();

    const devices = this.deviceDetector.findDevices();
    const { ios, android } = devices;

    // Both devices connected
    if (ios && android) {
      if (options.prefer === "android") {
        Logger.info("Both devices connected. Running Android first.");
        this.runner.runAndroidOnDevice(android);
      } else {
        Logger.info("Both devices connected. Running iOS first.");
        this.runner.runIosOnDevice(ios);
      }
      return;
    }

    // Single device connected
    if (ios) {
      this.runner.runIosOnDevice(ios);
      return;
    }

    if (android) {
      this.runner.runAndroidOnDevice(android);
      return;
    }

    // No devices
    Logger.error("No physical devices connected.");
    Logger.info("iOS: Check device trust settings in Xcode");
    Logger.info("Android: Make sure USB debugging is enabled");
    process.exit(2);
  }
}

// CLI interface
function createCLI(): void {
  const program = new Command();

  program
    .name("react-native-device-runner")
    .description("🚀 Auto device detection & React Native/Expo app runner")
    .version(packageJson.version);

  program
    .option(
      "--prefer <platform>",
      "Preferred platform to run (ios | android)",
      "ios"
    )
    .action(async (options) => {
      const runner = new DeviceRunner();
      await runner.run({
        prefer: options.prefer as "ios" | "android",
      });
    });

  program.parse();
}

// When used as a module
export { DeviceRunner, ConfigLoader, DeviceDetector, AppRunner, Logger };
export * from "./types";

// When run directly from CLI
if (require.main === module) {
  createCLI();
}
