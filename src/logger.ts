import chalk from "chalk";

export class Logger {
  static header(): void {
    console.log(
      chalk.cyan(
        "┌─────────────────────────────────────────────────────────────────────────────┐"
      )
    );
    console.log(
      chalk.cyan("│") +
        chalk.white(
          "                🚀 React Native Device Runner                          "
        ) +
        chalk.cyan("│")
    );
    console.log(
      chalk.cyan("│") +
        chalk.white(
          "              Auto Device Detection & Runner Script                         "
        ) +
        chalk.cyan("│")
    );
    console.log(
      chalk.cyan(
        "└─────────────────────────────────────────────────────────────────────────────┘"
      )
    );
    console.log();
  }

  static step(message: string): void {
    console.log(chalk.blue("📋") + " " + message);
  }

  static success(message: string): void {
    console.log(chalk.green("✅") + " " + message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow("⚠️") + " " + message);
  }

  static error(message: string): void {
    console.log(chalk.red("❌") + " " + message);
  }

  static info(message: string): void {
    console.log(chalk.magenta("ℹ️") + " " + message);
  }

  static device(message: string): void {
    console.log(chalk.cyan("📱") + " " + message);
  }

  static separator(): void {
    console.log(
      chalk.cyan(
        "──────────────────────────────────────────────────────────────────────────────"
      )
    );
  }
}
