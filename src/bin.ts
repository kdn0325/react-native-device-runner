#!/usr/bin/env node

import { DeviceRunner } from "./index";
import { Command } from "commander";
import packageJson from "../package.json";

try {
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
} catch (error) {
  console.error("Error:", (error as Error).message);
  process.exit(1);
}
