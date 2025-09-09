import chalk from 'chalk';

export class Logger {
  static header(): void {
    console.log(chalk.cyan('┌─────────────────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('│') + chalk.white('                    🚀 Expo Device Runner v2.0                              ') + chalk.cyan('│'));
    console.log(chalk.cyan('│') + chalk.white('              자동 기기 감지 & 실행 스크립트                                 ') + chalk.cyan('│'));
    console.log(chalk.cyan('└─────────────────────────────────────────────────────────────────────────────┘'));
    console.log();
  }

  static step(message: string): void {
    console.log(chalk.blue('📋') + ' ' + message);
  }

  static success(message: string): void {
    console.log(chalk.green('✅') + ' ' + message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠️') + ' ' + message);
  }

  static error(message: string): void {
    console.log(chalk.red('❌') + ' ' + message);
  }

  static info(message: string): void {
    console.log(chalk.magenta('ℹ️') + ' ' + message);
  }

  static device(message: string): void {
    console.log(chalk.cyan('📱') + ' ' + message);
  }

  static separator(): void {
    console.log(chalk.cyan('──────────────────────────────────────────────────────────────────────────────'));
  }
}
