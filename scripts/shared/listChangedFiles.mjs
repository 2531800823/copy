import { execFileSync } from 'node:child_process'
import process from 'node:process'

/**
 * 执行命令行工具
 * @param {string} command - 要执行的命令
 * @param {string[]} args - 命令参数
 * @returns {string} 命令输出结果
 */
function exec(command, args) {
  console.log(`> ${[command].concat(args).join(' ')}`)
  const options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf-8',
  }
  return execFileSync(command, args, options)
}

/**
 * 执行git命令并返回结果数组
 * @param {string[]} args - git命令参数
 * @returns {string[]} 命令输出的行数组
 */
function execGitCmd(args) {
  const result = exec('git', args).trim().toString()
  return result ? result.split('\n') : []
}

/**
 * 获取所有变更的文件列表
 * 包括：工作区变更、暂存区变更、未跟踪的文件
 * @returns {Set<string>} 变更文件的集合
 */
function listChangedFiles() {
  return new Set([
    // 获取暂存区的变更文件（已add但未commit的文件）
    ...execGitCmd(['diff', '--name-only', '--cached']),
    // 获取工作区的变更文件（已修改但未add的文件）
    ...execGitCmd(['diff', '--name-only']),
    // 获取未跟踪的文件（新文件，未被git管理）
    ...execGitCmd(['ls-files', '--others', '--exclude-standard']),
  ])
}

export default listChangedFiles
