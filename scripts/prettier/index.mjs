import fs from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import * as glob from 'glob';
import prettier from 'prettier';
import listChangedFiles from '../shared/listChangedFiles.mjs';

/**
 * 将路径统一转换为正斜杠格式（用于跨平台路径比较）
 * @param {string} path - 文件路径
 * @returns {string} 标准化后的路径
 */
const normalizePath = path => path.replace(/\\/g, '/')

const prettierConfigPath = fileURLToPath(
  import.meta.resolve('../../.prettierrc.mjs'),
);
(() => {
  const mode = process.argv[2] || 'check'
  const shouldWrite = mode === 'write' || mode === 'write-changed'
  const onlyChanged = mode === 'check-changed' || mode === 'write-changed'

  const changedFiles = onlyChanged ? listChangedFiles() : null
  let didWarn = false
  let didError = false

  // 将变更文件路径标准化
  const normalizedChangedFiles
    = onlyChanged && changedFiles
      ? new Set(Array.from(changedFiles).map(normalizePath))
      : null

  const allFiles = glob.sync(
    ['**/*.{js,mjs,cjs,ts,jsx,tsx,scss,css,md,html,yaml,json}'],
    {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/esbuild-plugin-d.ts/**',
        '**/pnpm-lock.yaml',
        '**/pnpm-workspace.yaml',
        '**/.next/**',
      ],
    },
  );

  // 使用标准化路径进行比较
  const files = allFiles.filter(
    f => !onlyChanged || normalizedChangedFiles.has(normalizePath(f)),
  );

  if (!files.length) {
    return
  }

  files.forEach(async (file) => {
    const options = await prettier.resolveConfig(file, {
      config: prettierConfigPath,
      editorconfig: true,
    })

    try {
      const input = fs.readFileSync(file, 'utf8')
      if (shouldWrite) {
        const output = await prettier.format(input, options)
        if (output !== input) {
          fs.writeFileSync(file, output, 'utf8')
        }
      }
      else {
        if (!(await prettier.check(input, options))) {
          if (!didWarn) {
            console.log(
              `\n${chalk.red(
                `  This project uses prettier to format all JavaScript code.\n`,
              )}${chalk.dim(`    Please run `)}${chalk.reset(
                'pnpm prettier-all',
              )}${chalk.dim(
                ` and add changes to files listed below to your commit:`,
              )}\n\n`,
            );
            didWarn = true
          }
          console.log(file)
        }
      }
    }
    catch (error) {
      didError = true
      console.log(`\n\n${error.message}`)
      console.log(file)
    }
  })

  if (didWarn || didError) {
    process.exit(1)
  }
  else {
    console.log('Code formatted.\n')
  }
})()
