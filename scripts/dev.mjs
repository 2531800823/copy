#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 支持选择性启动前端、后端或全部服务
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

const services = {
  web: {
    name: '前端服务',
    command: 'pnpm',
    args: ['dev:web'],
    color: 'blue',
    port: 7010,
  },
  server: {
    name: '后端服务',
    command: 'pnpm',
    args: ['dev:server'],
    color: 'green',
    port: 7011,
  },
  desktop: {
    name: '桌面应用',
    command: 'pnpm',
    args: ['dev:desktop'],
    color: 'magenta',
    port: null,
  },
};

/**
 * 启动服务
 */
function startService(serviceKey) {
  const service = services[serviceKey];
  if (!service) {
    console.error(chalk.red(`❌ 未知服务: ${serviceKey}`));
    return null;
  }

  console.log(chalk[service.color](`🚀 启动 ${service.name}...`));
  
  const child = spawn(service.command, service.args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  child.on('error', (error) => {
    console.error(chalk.red(`❌ ${service.name} 启动失败:`), error);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(chalk.red(`❌ ${service.name} 退出，代码: ${code}`));
    }
  });

  return child;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  console.log(chalk.cyan('🔧 Copy 项目开发环境'));
  console.log(chalk.gray('='.repeat(50)));

  if (args.length === 0 || args.includes('all')) {
    // 启动所有服务
    console.log(chalk.yellow('📦 启动所有服务...'));
    Object.keys(services).forEach(startService);
  } else {
    // 启动指定服务
    args.forEach(arg => {
      if (services[arg]) {
        startService(arg);
      } else {
        console.error(chalk.red(`❌ 未知服务: ${arg}`));
        console.log(chalk.yellow('可用服务:'), Object.keys(services).join(', '));
      }
    });
  }

  // 显示服务信息
  setTimeout(() => {
    console.log(chalk.gray('\n' + '='.repeat(50)));
    console.log(chalk.cyan('📋 服务信息:'));
    Object.entries(services).forEach(([key, service]) => {
      if (service.port) {
        console.log(chalk[service.color](`  ${service.name}: http://localhost:${service.port}`));
      } else {
        console.log(chalk[service.color](`  ${service.name}: 桌面应用`));
      }
    });
    console.log(chalk.gray('='.repeat(50)));
  }, 1000);
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 正在退出开发环境...'));
  process.exit(0);
});

main();
