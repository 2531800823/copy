import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { isDev } from '../config/env'

/**
 * 获取最可能的渲染进程路径
 */
export function getRendererPath() {
  if (isDev) {
    const devPath = path.join(__dirname, '../../../web/dist/') // 开发环境使用web/dist
    console.log(`开发环境使用路径: ${devPath}`)
    return devPath
  }

  console.log('当前应用路径信息:')
  console.log(`- 可执行文件路径: ${app.getPath('exe')}`)
  console.log(`- 应用程序目录: ${app.getAppPath()}`)
  console.log(`- 用户数据目录: ${app.getPath('userData')}`)
  console.log(`- 当前工作目录: ${process.cwd()}`)

  // 生产环境下尝试多个可能的路径
  const possiblePaths = [
    path.join(app.getPath('exe'), '../../resources/web/dist'), // electron-builder extraFiles
    path.join(app.getPath('exe'), '../resources/web/dist'), // 相对于exe的另一种路径
    path.join(app.getAppPath(), '../web/dist'), // 应用根目录
    path.join(app.getAppPath(), 'dist'), // 默认dist目录
    path.join(app.getAppPath(), '../../web/dist'), // 往上两级查找
    path.join(process.cwd(), 'resources/web/dist'), // 相对于当前工作目录
    path.join(process.cwd(), 'web/dist'), // 相对于当前工作目录
    path.join(process.cwd(), '../web/dist'), // 相对于当前工作目录向上一级
    path.join(app.getPath('userData'), '../web/dist'), // 相对于用户数据目录
  ]

  // 检查每个可能的路径
  for (const testPath of possiblePaths) {
    try {
      console.log(`检查路径: ${testPath}`)

      if (fs.existsSync(testPath)) {
        console.log(`找到有效的渲染进程路径: ${testPath}`)

        // 检查index.html是否存在
        const indexPath = path.join(testPath, 'index.html')
        if (fs.existsSync(indexPath)) {
          console.log(`index.html存在于: ${indexPath}`)

          // 列出目录内容
          try {
            const files = fs.readdirSync(testPath)
            console.log(`目录内容: ${files.join(', ')}`)

            return testPath
          }
          catch (error: any) {
            console.error(`无法读取目录内容: ${error.message}`)
          }
        }
        else {
          console.log(`index.html不存在于: ${indexPath}`)
        }
      }
    }
    catch (error: any) {
      console.error(`检查路径出错: ${testPath}, 错误: ${error.message}`)
      // 忽略错误，继续检查下一个路径
    }
  }

  // 使用app.asar提取的路径
  const asarPaths = [
    path.join(app.getPath('exe'), '../resources/app.asar.unpacked/dist'),
    path.join(app.getPath('exe'), '../resources/app.asar.unpacked/web/dist'),
    path.join(app.getAppPath(), 'dist'),
  ]

  for (const asarPath of asarPaths) {
    try {
      console.log(`检查asar路径: ${asarPath}`)
      if (fs.existsSync(asarPath)) {
        console.log(`找到有效的asar解压渲染进程路径: ${asarPath}`)
        return asarPath
      }
    }
    catch {
      // 忽略错误
    }
  }

  // 如果都不存在，返回一个默认路径，稍后会尝试多种方式加载
  const defaultPath = path.join(app.getPath('exe'), '../../resources/web/dist')
  console.log(`未找到有效路径，使用默认路径: ${defaultPath}`)
  return defaultPath
}

/** 添加 Web 构建产物的路径 */
export const RENDERER_DIST = getRendererPath()
