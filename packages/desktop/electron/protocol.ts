import fs from 'node:fs'
import path from 'node:path'
import { net, protocol } from 'electron'
import logger from './logger'
import { isDev, RENDERER_DIST } from './main'

/**
 * 设置自定义协议，解决静态资源加载问题
 */
export function setupProtocol() {
  if (isDev) {
    return
  }

  logger.debug('Protocol', '设置app://协议处理器')

  // 注册app协议
  protocol.handle('app', (request) => {
    const url = request.url.slice('app://'.length)
    const decodedUrl = decodeURI(url)

    try {
      // 判断是否为静态资源
      const isStatic = /\.[a-z0-9]+$/i.test(decodedUrl)

      let filePath
      if (!decodedUrl || decodedUrl === './' || decodedUrl === '.' || !isStatic) {
        // 返回 index.html
        filePath = path.join(RENDERER_DIST, 'index.html')
      }
      else {
        // 返回真实静态资源
        filePath = path.join(RENDERER_DIST, decodedUrl)
      }

      logger.debug('Protocol', `请求资源: ${request.url} -> ${filePath}`)

      // ... 省略后面代码 ...
    }
    catch (error) {
      logger.error('Protocol', `处理请求时出错: ${error.message}`)
      return { status: 500, body: 'Internal Server Error' }
    }
  })
}
